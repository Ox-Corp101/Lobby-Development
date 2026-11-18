import type { BrowserContext, Route } from '@playwright/test';

/**
 * A small, in-memory imitation of the Supabase Auth endpoints that Lobby uses.
 *
 * It runs inside the test runner and answers the browser's requests to a fake
 * host (`*.lobby.test`, a reserved name that never exists on the internet).
 * Nothing is sent to a real Supabase project, no real email is ever sent and
 * no real account is touched. Each test gets a fresh instance, so results
 * are deterministic and tests can be run any number of times.
 *
 * It behaves like the real service where Lobby depends on it:
 * - sign-up and password resets store a PKCE challenge, and "clicking the
 *   email link" (`emailLink`) returns the redirect Supabase would produce;
 * - code exchange checks the browser's verifier against that challenge
 *   (SHA-256), and each code works once;
 * - error responses use Supabase's error codes.
 */
export const FAKE_SUPABASE_URL = 'https://fake-supabase.lobby.test';
export const FAKE_SUPABASE_KEY = 'sb_publishable_e2e_fake_key';

type User = { id: string; email: string; password: string; confirmed: boolean };
type Flow = { challenge: string; type: 'signup' | 'recovery'; email: string; redirectTo: string };
type Override = (route: Route) => Promise<void> | void;

const encoder = new TextEncoder();

function base64url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return base64url(new Uint8Array(digest));
}

const json = (value: unknown) => base64url(encoder.encode(JSON.stringify(value)));

export class FakeSupabase {
  /** Every request received, as "METHOD /path?query" (never bodies). */
  readonly requests: string[] = [];
  /** Delay added to every response, so loading states are visible. */
  latencyMs = 150;

  private readonly users = new Map<string, User>();
  private readonly flows: Flow[] = [];
  private readonly codes = new Map<string, Flow & { used: boolean; expired: boolean }>();
  private readonly sessions = new Map<string, string>(); // access token -> email
  private readonly overrides = new Map<string, Override>();
  private idCounter = 0;

  /** Adds a test rider (confirmed by default). */
  addUser(email: string, password: string, { confirmed = true } = {}): void {
    this.users.set(email, { id: this.nextId(), email, password, confirmed });
  }

  /** Current password of a test rider (to check password updates). */
  passwordOf(email: string): string | undefined {
    return this.users.get(email)?.password;
  }

  /** Number of active server-side sessions for a rider. */
  sessionCount(email: string): number {
    return [...this.sessions.values()].filter((e) => e === email).length;
  }

  /** How many requests started with this prefix, e.g. "POST /token?grant_type=pkce". */
  count(prefix: string): number {
    return this.requests.filter((r) => r.startsWith(prefix)).length;
  }

  /** Replaces the response for one endpoint, e.g. "POST /recover". */
  override(endpoint: string, handler: Override): void {
    this.overrides.set(endpoint, handler);
  }

  /** Answers one endpoint with a Supabase-style error. */
  failWith(endpoint: string, status: number, code: string): void {
    this.override(endpoint, (route) =>
      this.respond(route, status, { code, error_code: code, message: code }),
    );
  }

  /**
   * Simulates the rider clicking the newest Supabase email link of this type:
   * Supabase verifies it (confirming the email for sign-up) and redirects to
   * the app with `?code=…`. Returns that redirect path.
   */
  emailLink(type: Flow['type'], email: string, { expired = false } = {}): string {
    const flow = [...this.flows].reverse().find((f) => f.type === type && f.email === email);
    if (!flow) throw new Error(`No ${type} email was requested for ${email}`);
    if (type === 'signup') {
      const user = this.users.get(email);
      if (user) user.confirmed = true;
    }
    const code = crypto.randomUUID();
    this.codes.set(code, { ...flow, used: false, expired });
    const target = new URL(flow.redirectTo);
    target.searchParams.set('code', code);
    return `${target.pathname}${target.search}`;
  }

  /** Answers all requests to the fake Supabase host in this browser context. */
  async install(context: BrowserContext): Promise<void> {
    await context.route(`${FAKE_SUPABASE_URL}/**`, (route) => this.handle(route));
  }

  private nextId(): string {
    this.idCounter += 1;
    return `00000000-0000-4000-8000-${String(this.idCounter).padStart(12, '0')}`;
  }

  private userPayload(user: User) {
    return {
      id: user.id,
      aud: 'authenticated',
      role: 'authenticated',
      email: user.email,
      email_confirmed_at: user.confirmed ? '2026-01-01T00:00:00Z' : null,
      app_metadata: {},
      user_metadata: {},
      identities: [],
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };
  }

  private newSession(user: User) {
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;
    const accessToken = `${json({ alg: 'HS256', typ: 'JWT' })}.${json({
      sub: user.id,
      email: user.email,
      role: 'authenticated',
      aud: 'authenticated',
      exp: expiresAt,
      session_id: crypto.randomUUID(),
    })}.fake-signature`;
    this.sessions.set(accessToken, user.email);
    return {
      access_token: accessToken,
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: expiresAt,
      refresh_token: `refresh-${crypto.randomUUID()}`,
      user: this.userPayload(user),
    };
  }

  private async respond(route: Route, status: number, body: unknown): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    await route.fulfill({
      status,
      contentType: 'application/json',
      headers: {
        'access-control-allow-origin': '*',
        'access-control-expose-headers': 'x-supabase-api-version',
        'x-supabase-api-version': '2024-01-01',
      },
      body: body === null ? '' : JSON.stringify(body),
    });
  }

  private error(route: Route, status: number, code: string) {
    return this.respond(route, status, { code, error_code: code, message: code });
  }

  private async handle(route: Route): Promise<void> {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/auth\/v1/, '');
    const method = request.method();

    if (method === 'OPTIONS') {
      return route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-headers': '*',
          'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
        },
      });
    }

    this.requests.push(`${method} ${path}${url.search}`);
    const override = this.overrides.get(`${method} ${path}`);
    if (override) return override(route);

    const body = (request.postDataJSON() ?? {}) as Record<string, string | undefined>;
    const bearer = (request.headers()['authorization'] ?? '').replace(/^Bearer /, '');
    const sessionEmail = this.sessions.get(bearer);

    if (method === 'POST' && path === '/signup') {
      if (!body.code_challenge) return this.error(route, 400, 'validation_failed');
      const email = body.email ?? '';
      const existing = this.users.get(email);
      // Like Supabase with "Confirm email" on: an existing address gets the same answer.
      if (existing) return this.respond(route, 200, this.userPayload(existing));
      const user: User = {
        id: this.nextId(),
        email,
        password: body.password ?? '',
        confirmed: false,
      };
      this.users.set(email, user);
      this.flows.push({
        challenge: body.code_challenge,
        type: 'signup',
        email,
        redirectTo: url.searchParams.get('redirect_to') ?? '',
      });
      return this.respond(route, 200, this.userPayload(user));
    }

    if (
      method === 'POST' &&
      path === '/token' &&
      url.searchParams.get('grant_type') === 'password'
    ) {
      const user = this.users.get(body.email ?? '');
      if (!user || user.password !== body.password)
        return this.error(route, 400, 'invalid_credentials');
      if (!user.confirmed) return this.error(route, 400, 'email_not_confirmed');
      return this.respond(route, 200, this.newSession(user));
    }

    if (method === 'POST' && path === '/token' && url.searchParams.get('grant_type') === 'pkce') {
      const entry = this.codes.get(body.auth_code ?? '');
      if (!entry || entry.used) return this.error(route, 404, 'flow_state_not_found');
      if (entry.expired) return this.error(route, 403, 'flow_state_expired');
      if ((await sha256(body.code_verifier ?? '')) !== entry.challenge) {
        return this.error(route, 400, 'bad_code_verifier');
      }
      entry.used = true;
      const user = this.users.get(entry.email);
      if (!user) return this.error(route, 404, 'user_not_found');
      return this.respond(route, 200, this.newSession(user));
    }

    if (method === 'POST' && path === '/recover') {
      const email = body.email ?? '';
      if (this.users.has(email) && body.code_challenge) {
        this.flows.push({
          challenge: body.code_challenge,
          type: 'recovery',
          email,
          redirectTo: body.redirect_to ?? url.searchParams.get('redirect_to') ?? '',
        });
      }
      return this.respond(route, 200, {}); // same answer for unknown addresses
    }

    if (method === 'POST' && path === '/resend') return this.respond(route, 200, {});

    if (path === '/user') {
      const user = sessionEmail ? this.users.get(sessionEmail) : undefined;
      if (!user) return this.error(route, 401, 'bad_jwt');
      if (method === 'PUT') {
        if (body.password !== undefined) {
          if (body.password === user.password) return this.error(route, 422, 'same_password');
          user.password = body.password;
        }
      }
      return this.respond(route, 200, this.userPayload(user));
    }

    if (method === 'POST' && path === '/logout') {
      const scope = url.searchParams.get('scope') ?? 'global';
      if (sessionEmail) {
        for (const [token, email] of [...this.sessions]) {
          const isCurrent = token === bearer;
          if (email !== sessionEmail) continue;
          if (
            scope === 'global' ||
            (scope === 'local' && isCurrent) ||
            (scope === 'others' && !isCurrent)
          ) {
            this.sessions.delete(token);
          }
        }
      }
      return this.respond(route, 204, null);
    }

    if (method === 'POST' && path === '/verify') return this.error(route, 403, 'otp_expired');

    return this.error(route, 404, 'not_found');
  }
}
