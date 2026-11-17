import { isSecretSupabaseKey } from './secretKeys';

export type SupabaseConfig = { url: string; publishableKey: string };

export type SupabaseConfigResult =
  | { ok: true; config: SupabaseConfig }
  | { ok: false; problem: 'missing' | 'invalid_url' | 'secret_key' };

type EnvLike = Record<string, string | boolean | undefined>;

/** Hosts allowed for the Supabase URL: hosted projects (https) or a local dev stack. */
function isAllowedSupabaseUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol === 'https:') return true;
    return (
      url.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
    );
  } catch {
    return false;
  }
}

/**
 * Reads the two public Supabase settings from Vite's environment.
 * Only the Project URL and the publishable key are ever read.
 */
export function readSupabaseConfig(env: EnvLike): SupabaseConfigResult {
  const url = typeof env.VITE_SUPABASE_URL === 'string' ? env.VITE_SUPABASE_URL.trim() : '';
  const key =
    typeof env.VITE_SUPABASE_PUBLISHABLE_KEY === 'string'
      ? env.VITE_SUPABASE_PUBLISHABLE_KEY.trim()
      : '';

  // Check for a secret key first, so it's reported even if the URL is missing too.
  if (isSecretSupabaseKey(key)) return { ok: false, problem: 'secret_key' };
  if (!url || !key) return { ok: false, problem: 'missing' };
  if (!isAllowedSupabaseUrl(url)) return { ok: false, problem: 'invalid_url' };
  return { ok: true, config: { url: url.replace(/\/+$/, ''), publishableKey: key } };
}
