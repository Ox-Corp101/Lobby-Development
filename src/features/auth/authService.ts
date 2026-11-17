import { isAuthApiError, isAuthRetryableFetchError } from '@supabase/supabase-js';
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
