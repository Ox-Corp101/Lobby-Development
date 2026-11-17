import {
  isAuthApiError,
  isAuthPKCECodeVerifierMissingError,
  isAuthRetryableFetchError,
} from '@supabase/supabase-js';
import type { AuthError, EmailOtpType } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import type { EmailOnlyValues, ResetPasswordValues, SignInValues, SignUpValues } from './schemas';

/**
 * The single boundary between the auth screens and Supabase Auth.
 *
 * Screens call these functions and react only to the result `kind`.
 * Results never contain passwords, and nothing here logs request data.
 * Responses that could reveal whether an email has an account (sign-up,
 * password reset, resend) are reported as a neutral `ok`.
 */
export type AuthResult =
  | { kind: 'ok' }
  | { kind: 'invalid_credentials' }
  | { kind: 'email_not_confirmed' }
  | { kind: 'invalid_or_expired_link' }
  /** A PKCE code arrived, but this browser doesn't hold the matching verifier. */
  | { kind: 'different_browser' }
  | { kind: 'weak_password' }
  | { kind: 'same_password' }
  | { kind: 'rate_limited' }
  | { kind: 'network_error' }
  | { kind: 'error' };

const ok: AuthResult = { kind: 'ok' };

/** Where Supabase should send riders back to. Only used for templates that use {{ .RedirectTo }}. */
const appUrl = (path: string) => `${window.location.origin}${path}`;

function client() {
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
}

/** Translates Supabase errors into the small set of outcomes the screens understand. */
function toResult(error: AuthError): AuthResult {
  if (isAuthRetryableFetchError(error)) return { kind: 'network_error' };
  switch (error.code) {
    case 'invalid_credentials':
      return { kind: 'invalid_credentials' };
    case 'email_not_confirmed':
      return { kind: 'email_not_confirmed' };
    case 'otp_expired':
    case 'bad_code_verifier':
    case 'flow_state_expired':
    case 'flow_state_not_found':
    case 'bad_jwt':
    case 'session_not_found':
    case 'session_expired':
      return { kind: 'invalid_or_expired_link' };
    case 'weak_password':
      return { kind: 'weak_password' };
    case 'same_password':
      return { kind: 'same_password' };
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return { kind: 'rate_limited' };
  }
  if (isAuthApiError(error) && error.status === 429) return { kind: 'rate_limited' };
  if (error.name === 'AuthSessionMissingError') return { kind: 'invalid_or_expired_link' };
  return { kind: 'error' };
}

/**
 * Wraps a call so unexpected exceptions (e.g. offline) become a result
 * instead of crashing the screen.
 */
async function run(call: () => Promise<{ error: AuthError | null }>): Promise<AuthResult> {
  try {
    const { error } = await call();
    return error ? toResult(error) : ok;
  } catch {
    return { kind: 'network_error' };
  }
}

/**
 * Reads token_hash/type from an email link. Returns null for anything
 * malformed, so bad links are rejected without contacting Supabase.
 */
export function readEmailLink(
  params: URLSearchParams,
  allowedTypes: readonly EmailOtpType[],
): { tokenHash: string; type: EmailOtpType } | null {
  const tokenHash = params.get('token_hash') ?? '';
  const type = params.get('type') ?? '';
  if (!/^[A-Za-z0-9_-]{6,512}$/.test(tokenHash)) return null;
  if (!(allowedTypes as readonly string[]).includes(type)) return null;
  return { tokenHash, type: type as EmailOtpType };
}

/**
 * What an email-link landing page (/auth/confirm, /reset-password) was opened with.
 *
 * - `code`: PKCE authorization code from Supabase's default email templates,
 *   plus supabase-js's `sb_flow_id`, which says which stored verifier to use.
 * - `token_hash`: our own link format (needs custom templates; kept for later).
 * - `error`: Supabase redirected back with an error (e.g. expired link).
 * - `implicit_fragment`: tokens in the #fragment (old emails / implicit flow).
 *   Only the parameter NAMES are checked; token values are never read or used.
 * - `none`: nothing auth-related in the address.
 * - `malformed`: auth parameters present but not in a valid shape.
 */
export type AuthCallback =
  | { kind: 'code'; code: string; flowId?: string }
  | { kind: 'token_hash'; link: EmailLink }
  | { kind: 'error'; result: AuthResult }
  | { kind: 'implicit_fragment' }
  | { kind: 'none' }
  | { kind: 'malformed' };

const AUTH_PARAM_NAMES = [
  'code',
  'sb_flow_id',
  'token_hash',
  'type',
  'error',
  'error_code',
  'error_description',
];

export function readAuthCallback(
  location: { search: string; hash: string },
  allowedTypes: readonly EmailOtpType[],
): AuthCallback {
  const query = new URLSearchParams(location.search);
  const fragment = new URLSearchParams(location.hash.replace(/^#/, ''));

  const errorCode = query.get('error_code') ?? fragment.get('error_code');
  const error = query.get('error') ?? fragment.get('error');
  if (errorCode || error) {
    const expired =
      errorCode === 'otp_expired' ||
      errorCode === 'flow_state_expired' ||
      errorCode === 'flow_state_not_found' ||
      error === 'access_denied';
    return {
      kind: 'error',
      result: expired ? { kind: 'invalid_or_expired_link' } : { kind: 'error' },
    };
  }

  if (query.has('code')) {
    const code = query.get('code') ?? '';
    if (!/^[A-Za-z0-9-]{8,128}$/.test(code)) return { kind: 'malformed' };
    // Added by supabase-js to the redirect address; selects this request's verifier.
    const flowId = query.get('sb_flow_id') ?? undefined;
    if (flowId !== undefined && !/^[A-Za-z0-9_-]{8,64}$/.test(flowId)) return { kind: 'malformed' };
    return { kind: 'code', code, flowId };
  }

  if (query.has('token_hash') || query.has('type')) {
    const link = readEmailLink(query, allowedTypes);
    return link ? { kind: 'token_hash', link } : { kind: 'malformed' };
  }

  if (fragment.has('access_token') || fragment.has('refresh_token')) {
    return { kind: 'implicit_fragment' };
  }
  return { kind: 'none' };
}

/** True if the address still contains anything auth-related (query or fragment). */
export function hasAuthParams(location: { search: string; hash: string }): boolean {
  if (location.hash && location.hash !== '#') return true;
  const query = new URLSearchParams(location.search);
  return AUTH_PARAM_NAMES.some((name) => query.has(name));
}

/**
 * Exactly one exchange per code for the lifetime of the page. React
 * development mode mounts components twice; both mounts share one request.
 * There is no retry: supabase-js deletes this browser's verifier after ANY
 * failed exchange (including network errors), so a code can never be
 * exchanged a second time.
 */
const codeExchanges = new Map<string, Promise<AuthResult>>();

function exchangeCode(code: string, flowId?: string): Promise<AuthResult> {
  const existing = codeExchanges.get(code);
  if (existing) return existing;

  const exchange = (async (): Promise<AuthResult> => {
    try {
      // Pass the flow id explicitly (rather than letting supabase-js read the
      // address bar), so the right verifier is used even after the URL changes.
      const { error } = await client().auth.exchangeCodeForSession(
        code,
        flowId ? { flowId } : undefined,
      );
      if (!error) return ok;
      if (isAuthPKCECodeVerifierMissingError(error)) return { kind: 'different_browser' };
      return toResult(error);
    } catch (error) {
      if (isAuthPKCECodeVerifierMissingError(error)) return { kind: 'different_browser' };
      return { kind: 'network_error' };
    }
  })();

  codeExchanges.set(code, exchange);
  return exchange;
}

export const CONFIRM_LINK_TYPES = ['email', 'signup'] as const;
export const RECOVERY_LINK_TYPES = ['recovery'] as const;

export type EmailLink = NonNullable<ReturnType<typeof readEmailLink>>;

export const authService = {
  async signUp({ email, password }: SignUpValues): Promise<AuthResult> {
    const result = await run(() =>
      client().auth.signUp({
        email,
        password,
        options: { emailRedirectTo: appUrl('/auth/confirm') },
      }),
    );
    // An already-registered email must look identical to a new one.
    return result.kind === 'invalid_credentials' || result.kind === 'error' ? ok : result;
  },

  signIn({ email, password }: SignInValues): Promise<AuthResult> {
    return run(() => client().auth.signInWithPassword({ email, password }));
  },

  /**
   * Signs out of this device only (approved). Other devices stay signed in.
   * Supabase removes the local session before contacting the server, so a
   * failed server call can still leave this device signed out. Success is
   * therefore judged by whether a session remains on this device.
   */
  async signOut(): Promise<AuthResult> {
    const result = await run(() => client().auth.signOut({ scope: 'local' }));
    if (result.kind === 'ok') return result;
    try {
      const { data } = await client().auth.getSession();
      return data.session ? result : ok;
    } catch {
      return result;
    }
  },

  async requestPasswordReset({ email }: EmailOnlyValues): Promise<AuthResult> {
    const result = await run(() =>
      client().auth.resetPasswordForEmail(email, { redirectTo: appUrl('/reset-password') }),
    );
    // Neutral unless the rider needs to slow down or is offline.
    return result.kind === 'rate_limited' || result.kind === 'network_error' ? result : ok;
  },

  async resendConfirmation({ email }: EmailOnlyValues): Promise<AuthResult> {
    const result = await run(() =>
      client().auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: appUrl('/auth/confirm') },
      }),
    );
    return result.kind === 'rate_limited' || result.kind === 'network_error' ? result : ok;
  },

  /**
   * Verifies an email link (confirmation or recovery). Only called after the
   * rider deliberately presses a button — never on page load — so link-scanning
   * email security tools can't use up the one-time token.
   */
  verifyEmailLink({ tokenHash, type }: EmailLink): Promise<AuthResult> {
    return run(() => client().auth.verifyOtp({ token_hash: tokenHash, type }));
  },

  /**
   * Exchanges a PKCE `?code=` (from Supabase's default email templates) for a
   * session. Works only in the browser that started the sign-up or reset.
   * Called automatically, once, when the landing page opens.
   */
  exchangeCode,

  updatePassword({ password }: ResetPasswordValues): Promise<AuthResult> {
    return run(() => client().auth.updateUser({ password }));
  },
};

/** Plain-language message for an unsuccessful result. */
export function authErrorMessage(result: AuthResult): string {
  switch (result.kind) {
    case 'invalid_credentials':
      // Deliberately generic: never says which of the two was wrong.
      return 'Email or password is incorrect.';
    case 'email_not_confirmed':
      return 'Please confirm your email first.';
    case 'invalid_or_expired_link':
      return 'This link is invalid, has expired or has already been used.';
    case 'different_browser':
      return 'This link must be opened in the browser where the request was made.';
    case 'weak_password':
      return 'Please choose a different password.';
    case 'same_password':
      return 'Your new password must be different from your current one.';
    case 'rate_limited':
      return 'Too many attempts. Please wait a while and try again.';
    case 'network_error':
      return 'We couldn’t reach Lobby. Check your connection and try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
