/** Where signed-in riders go by default. */
export const DEFAULT_SIGNED_IN_PATH = '/profile';

const AUTH_ONLY_PATHS = ['/sign-in', '/sign-up'];

/**
 * Turns an untrusted "return to" value into a safe in-app path.
 * Only same-site paths are allowed: anything with a scheme, a host,
 * protocol-relative (`//evil.com`), backslash tricks or control characters
 * falls back to the default. Sign-in/sign-up are excluded to avoid loops.
 */
export function safeRedirectPath(value: unknown): string {
  if (typeof value !== 'string') return DEFAULT_SIGNED_IN_PATH;
  // eslint-disable-next-line no-control-regex
  if (!value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u001f]/.test(value)) {
    return DEFAULT_SIGNED_IN_PATH;
  }
  try {
    const base = 'https://lobby.invalid';
    const url = new URL(value, base);
    if (url.origin !== base) return DEFAULT_SIGNED_IN_PATH;
    if (AUTH_ONLY_PATHS.includes(url.pathname)) return DEFAULT_SIGNED_IN_PATH;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return DEFAULT_SIGNED_IN_PATH;
  }
}

/** Navigation state carried to /sign-in. */
export type SignInLocationState = {
  /** Set only by sign-out, to show the "You've signed out" notice. */
  signedOut?: boolean;
  /** The page a signed-out rider originally asked for. */
  from?: string;
};
