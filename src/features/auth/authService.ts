import type {
  ForgotPasswordValues,
  ResetPasswordValues,
  SignInValues,
  SignUpValues,
} from './schemas';

/**
 * The single boundary between the auth screens and the auth backend.
 *
 * Screens only ever call these functions and react to the result `kind`.
 * Step 3: every call returns `not_connected`. Nothing is sent anywhere and
 * nothing pretends to succeed.
 * Step 4: this file alone is changed to call Supabase.
 *
 * Results never contain the password, and messages for sign-in / sign-up /
 * reset requests stay generic so they can't reveal whether an email has an
 * account.
 */
export type AuthResult =
  | { kind: 'ok' }
  | { kind: 'not_connected' }
  | { kind: 'invalid_credentials' }
  | { kind: 'invalid_or_expired_link' }
  | { kind: 'rate_limited' }
  | { kind: 'error' };

export type AuthService = {
  signUp(values: SignUpValues): Promise<AuthResult>;
  signIn(values: SignInValues): Promise<AuthResult>;
  requestPasswordReset(values: ForgotPasswordValues): Promise<AuthResult>;
  updatePassword(values: ResetPasswordValues): Promise<AuthResult>;
  /** Verifies the email-confirmation link the rider arrived with. */
  confirmEmail(linkParams: URLSearchParams): Promise<AuthResult>;
};

const notConnected = async (): Promise<AuthResult> => ({ kind: 'not_connected' });

export const authService: AuthService = {
  signUp: notConnected,
  signIn: notConnected,
  requestPasswordReset: notConnected,
  updatePassword: notConnected,
  confirmEmail: notConnected,
};

/** Shown whenever the backend isn't connected yet. */
export const NOT_AVAILABLE_MESSAGE = 'This isn’t available yet.';

/** Plain-language message for a failed or unavailable auth result. */
export function authErrorMessage(result: AuthResult): string {
  switch (result.kind) {
    case 'not_connected':
      return NOT_AVAILABLE_MESSAGE;
    case 'invalid_credentials':
      // Deliberately generic: never says which of the two was wrong.
      return 'Email or password is incorrect.';
    case 'invalid_or_expired_link':
      return 'This link is invalid or has expired.';
    case 'rate_limited':
      return 'Too many attempts. Please wait a moment and try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
