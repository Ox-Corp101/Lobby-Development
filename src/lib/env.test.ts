import { describe, expect, it } from 'vitest';
import { readSupabaseConfig } from './env';

const URL_OK = 'https://abcd1234.supabase.co';
const KEY_OK = 'sb_publishable_abc123';

function fakeJwt(payload: Record<string, unknown>): string {
  const base64url = (value: object) =>
    btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${base64url({ alg: 'HS256' })}.${base64url(payload)}.signature`;
}

describe('readSupabaseConfig', () => {
  it('accepts a project URL and a publishable key', () => {
    expect(
      readSupabaseConfig({ VITE_SUPABASE_URL: URL_OK, VITE_SUPABASE_PUBLISHABLE_KEY: KEY_OK }),
    ).toEqual({ ok: true, config: { url: URL_OK, publishableKey: KEY_OK } });
  });

  it('trims whitespace and trailing slashes', () => {
    expect(
      readSupabaseConfig({
        VITE_SUPABASE_URL: `  ${URL_OK}/  `,
        VITE_SUPABASE_PUBLISHABLE_KEY: `  ${KEY_OK}  `,
      }),
    ).toEqual({ ok: true, config: { url: URL_OK, publishableKey: KEY_OK } });
  });

  it('accepts a legacy anon JWT key', () => {
    const anon = fakeJwt({ role: 'anon' });
    expect(
      readSupabaseConfig({ VITE_SUPABASE_URL: URL_OK, VITE_SUPABASE_PUBLISHABLE_KEY: anon }),
    ).toMatchObject({ ok: true });
  });

  it('reports missing settings', () => {
    expect(readSupabaseConfig({})).toEqual({ ok: false, problem: 'missing' });
    expect(readSupabaseConfig({ VITE_SUPABASE_URL: URL_OK })).toEqual({
      ok: false,
      problem: 'missing',
    });
    expect(readSupabaseConfig({ VITE_SUPABASE_PUBLISHABLE_KEY: KEY_OK })).toEqual({
      ok: false,
      problem: 'missing',
    });
  });

  it('ignores non-string values', () => {
    expect(
      readSupabaseConfig({ VITE_SUPABASE_URL: true, VITE_SUPABASE_PUBLISHABLE_KEY: true }),
    ).toEqual({ ok: false, problem: 'missing' });
  });

  it('rejects secret and service-role keys', () => {
    expect(
      readSupabaseConfig({
        VITE_SUPABASE_URL: URL_OK,
        VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_x',
      }),
    ).toEqual({ ok: false, problem: 'secret_key' });
    expect(
      readSupabaseConfig({
        VITE_SUPABASE_URL: URL_OK,
        VITE_SUPABASE_PUBLISHABLE_KEY: fakeJwt({ role: 'service_role' }),
      }),
    ).toEqual({ ok: false, problem: 'secret_key' });
  });

  it('reports a secret key even when the URL is missing', () => {
    expect(readSupabaseConfig({ VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_x' })).toEqual({
      ok: false,
      problem: 'secret_key',
    });
  });

  it('allows http only for a local Supabase stack', () => {
    for (const url of ['http://localhost:54321', 'http://127.0.0.1:54321']) {
      expect(
        readSupabaseConfig({ VITE_SUPABASE_URL: url, VITE_SUPABASE_PUBLISHABLE_KEY: KEY_OK }),
      ).toMatchObject({ ok: true });
    }
  });

  it('rejects plain http to other hosts and invalid URLs', () => {
    for (const url of ['http://example.com', 'not a url', 'ftp://abcd.supabase.co']) {
      expect(
        readSupabaseConfig({ VITE_SUPABASE_URL: url, VITE_SUPABASE_PUBLISHABLE_KEY: KEY_OK }),
      ).toEqual({ ok: false, problem: 'invalid_url' });
    }
  });
});
