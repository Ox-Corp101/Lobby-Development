import type { EmailOtpType } from '@supabase/supabase-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  authErrorMessage,
  CONFIRM_LINK_TYPES,
  hasAuthParams,
  readAuthCallback,
  readEmailLink,
  RECOVERY_LINK_TYPES,
  recoveryMarker,
  type AuthResult,
} from './authService';

const CODE = '11111111-2222-3333-4444-555555555555';
const at = (search: string, hash = '') => ({ search, hash });

describe('readEmailLink (token-hash links)', () => {
  const read = (query: string, types: readonly EmailOtpType[] = CONFIRM_LINK_TYPES) =>
    readEmailLink(new URLSearchParams(query), types);

  it('accepts a well-formed link of an allowed type', () => {
    expect(read('token_hash=abc123_-XYZ&type=email')).toEqual({
      tokenHash: 'abc123_-XYZ',
      type: 'email',
    });
    expect(read('token_hash=abcdef&type=recovery', RECOVERY_LINK_TYPES)).toEqual({
      tokenHash: 'abcdef',
      type: 'recovery',
    });
  });

  it('rejects missing, too short or unsafe token hashes', () => {
    expect(read('type=email')).toBeNull();
    expect(read('token_hash=abc&type=email')).toBeNull();
    expect(read('token_hash=%3Cscript%3E&type=email')).toBeNull();
  });

  it('rejects types that are not allowed on that page', () => {
    expect(read('token_hash=abcdef&type=recovery')).toBeNull(); // recovery on the confirm page
    expect(read('token_hash=abcdef&type=email', RECOVERY_LINK_TYPES)).toBeNull();
    expect(read('token_hash=abcdef')).toBeNull();
  });
});

describe('readAuthCallback (email-link landing pages)', () => {
  const read = (search: string, hash = '') =>
    readAuthCallback(at(search, hash), CONFIRM_LINK_TYPES);

  it('reads a PKCE code, with or without a flow id', () => {
    expect(read(`?code=${CODE}`)).toEqual({ kind: 'code', code: CODE, flowId: undefined });
    expect(read(`?code=${CODE}&sb_flow_id=0123456789abcdef`)).toEqual({
      kind: 'code',
      code: CODE,
      flowId: '0123456789abcdef',
    });
  });

  it('rejects malformed codes and flow ids', () => {
    expect(read('?code=bad%20code!')).toEqual({ kind: 'malformed' });
    expect(read('?code=short')).toEqual({ kind: 'malformed' });
    expect(read(`?code=${CODE}&sb_flow_id=bad!`)).toEqual({ kind: 'malformed' });
  });

  it('reads a token-hash link, or reports it as malformed', () => {
    expect(read('?token_hash=abcdef&type=email')).toEqual({
      kind: 'token_hash',
      link: { tokenHash: 'abcdef', type: 'email' },
    });
    expect(read('?token_hash=abcdef')).toEqual({ kind: 'malformed' });
    expect(read('?type=email')).toEqual({ kind: 'malformed' });
  });

  it('treats expired or used links as "invalid or expired" (query or fragment)', () => {
    const expired = { kind: 'error', result: { kind: 'invalid_or_expired_link' } };
    expect(read('?error=access_denied&error_code=otp_expired&error_description=x')).toEqual(
      expired,
    );
    expect(read('', '#error=access_denied&error_code=otp_expired')).toEqual(expired);
    expect(read('?error_code=flow_state_expired')).toEqual(expired);
    expect(read('?error_code=flow_state_not_found')).toEqual(expired);
  });

  it('treats other Supabase errors as a generic error', () => {
    expect(read('?error=server_error&error_code=unexpected_failure')).toEqual({
      kind: 'error',
      result: { kind: 'error' },
    });
  });

  it('gives errors priority over a code in the same address', () => {
    expect(read(`?code=${CODE}&error=access_denied`).kind).toBe('error');
  });

  it('recognises old-style fragment tokens by name only, never returning their values', () => {
    const result = read('', '#access_token=SECRET_A&refresh_token=SECRET_R&type=signup');
    expect(result).toEqual({ kind: 'implicit_fragment' });
    expect(JSON.stringify(result)).not.toContain('SECRET');
    expect(read('', '#refresh_token=SECRET_R')).toEqual({ kind: 'implicit_fragment' });
  });

  it('reports "none" when nothing auth-related is present', () => {
    expect(read('')).toEqual({ kind: 'none' });
    expect(read('?utm_source=newsletter', '#section')).toEqual({ kind: 'none' });
  });
});

describe('hasAuthParams (address-bar clean-up)', () => {
  it('is true when auth values are present in the query', () => {
    for (const name of [
      'code',
      'sb_flow_id',
      'token_hash',
      'type',
      'error',
      'error_code',
      'error_description',
    ]) {
      expect(hasAuthParams(at(`?${name}=x`))).toBe(true);
    }
  });

  it('is true for any fragment', () => {
    expect(hasAuthParams(at('', '#access_token=x'))).toBe(true);
    expect(hasAuthParams(at('', '#anything'))).toBe(true);
  });

  it('is false for a clean address or unrelated query values', () => {
    expect(hasAuthParams(at(''))).toBe(false);
    expect(hasAuthParams(at('', '#'))).toBe(false);
    expect(hasAuthParams(at('?utm_source=newsletter'))).toBe(false);
  });
});

describe('recoveryMarker (password-reset form gate)', () => {
  const KEY = 'lobby.passwordRecovery';
  let store: Map<string, string>;

  beforeEach(() => {
    store = new Map();
    vi.stubGlobal('window', {
      sessionStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
        removeItem: (k: string) => void store.delete(k),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const setMarker = (userId: unknown, expiresAt: unknown) =>
    store.set(KEY, JSON.stringify({ userId, expiresAt }));

  it('is valid only for the same user before expiry', () => {
    setMarker('user-1', Date.now() + 60_000);
    expect(recoveryMarker.isValidFor('user-1')).toBe(true);
    expect(recoveryMarker.isValidFor('user-2')).toBe(false);
  });

  it('is invalid once expired', () => {
    setMarker('user-1', Date.now() - 1);
    expect(recoveryMarker.isValidFor('user-1')).toBe(false);
  });

  it('is invalid when missing, malformed or for an unknown user', () => {
    expect(recoveryMarker.isValidFor('user-1')).toBe(false);
    store.set(KEY, 'not json');
    expect(recoveryMarker.isValidFor('user-1')).toBe(false);
    setMarker('user-1', 'tomorrow');
    expect(recoveryMarker.isValidFor('user-1')).toBe(false);
    setMarker('user-1', Date.now() + 60_000);
    expect(recoveryMarker.isValidFor(undefined)).toBe(false);
  });

  it('clear() removes the marker', () => {
    setMarker('user-1', Date.now() + 60_000);
    recoveryMarker.clear();
    expect(store.has(KEY)).toBe(false);
    expect(recoveryMarker.isValidFor('user-1')).toBe(false);
  });

  it('fails safely when storage is unavailable', () => {
    vi.stubGlobal('window', {
      sessionStorage: {
        getItem: () => {
          throw new Error('blocked');
        },
        removeItem: () => {
          throw new Error('blocked');
        },
      },
    });
    expect(recoveryMarker.isValidFor('user-1')).toBe(false);
    expect(() => recoveryMarker.clear()).not.toThrow();
  });
});

describe('authErrorMessage', () => {
  const message = (kind: AuthResult['kind']) => authErrorMessage({ kind } as AuthResult);

  it('keeps the sign-in error generic (never says which field was wrong)', () => {
    expect(message('invalid_credentials')).toBe('Email or password is incorrect.');
  });

  it('gives a specific, plain message for each known outcome', () => {
    expect(message('email_not_confirmed')).toBe('Please confirm your email first.');
    expect(message('invalid_or_expired_link')).toBe(
      'This link is invalid, has expired or has already been used.',
    );
    expect(message('different_browser')).toBe(
      'This link must be opened in the browser where the request was made.',
    );
    expect(message('same_password')).toBe(
      'Your new password must be different from your current one.',
    );
    expect(message('email_not_allowed')).toBe(
      'This email address can’t be used. Please use a different email address.',
    );
    expect(message('signup_unavailable')).toBe(
      'New accounts can’t be created right now. Please try again later.',
    );
    expect(message('reauthentication_needed')).toBe(
      'For your security, please request a new reset link.',
    );
    expect(message('reset_request_failed')).toBe(
      'We couldn’t send a reset link right now. Please try again.',
    );
    expect(message('rate_limited')).toBe('Too many attempts. Please wait a while and try again.');
    expect(message('network_error')).toBe(
      'We couldn’t reach Lobby. Check your connection and try again.',
    );
  });

  it('falls back to a generic message for unexpected errors', () => {
    expect(message('error')).toBe('Something went wrong. Please try again.');
  });
});
