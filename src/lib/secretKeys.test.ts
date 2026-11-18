import { describe, expect, it } from 'vitest';
import { isSecretSupabaseKey } from './secretKeys';

/** Builds a fake (unsigned) JWT whose payload has the given role. */
function fakeJwt(payload: Record<string, unknown>): string {
  const base64url = (value: object) =>
    btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${base64url({ alg: 'HS256', typ: 'JWT' })}.${base64url(payload)}.signature`;
}

describe('isSecretSupabaseKey', () => {
  it('detects new-style secret keys', () => {
    expect(isSecretSupabaseKey('sb_secret_abc123')).toBe(true);
  });

  it('detects secret keys even with surrounding whitespace', () => {
    expect(isSecretSupabaseKey('  sb_secret_abc123  ')).toBe(true);
  });

  it('detects legacy JWT keys with the service_role role', () => {
    expect(isSecretSupabaseKey(fakeJwt({ role: 'service_role', iss: 'supabase' }))).toBe(true);
  });

  it('accepts publishable keys', () => {
    expect(isSecretSupabaseKey('sb_publishable_abc123')).toBe(false);
  });

  it('accepts legacy anon JWT keys', () => {
    expect(isSecretSupabaseKey(fakeJwt({ role: 'anon', iss: 'supabase' }))).toBe(false);
  });

  it('treats missing or empty values as not secret', () => {
    expect(isSecretSupabaseKey(undefined)).toBe(false);
    expect(isSecretSupabaseKey('')).toBe(false);
  });

  it('does not crash on three-part values that are not valid JWTs', () => {
    expect(isSecretSupabaseKey('not.a.jwt')).toBe(false);
    expect(isSecretSupabaseKey('a.!!!.c')).toBe(false);
  });
});
