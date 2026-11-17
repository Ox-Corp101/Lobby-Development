/**
 * Detects Supabase keys that must NEVER reach the browser: new-style secret
 * keys (`sb_secret_…`) and legacy JWT keys whose role is `service_role`.
 *
 * Pure function with no browser or Vite dependencies, so it is shared by the
 * app (runtime check) and vite.config.ts (dev/build-time check).
 */
export function isSecretSupabaseKey(value: string | undefined): boolean {
  if (!value) return false;
  const key = value.trim();
  if (key.startsWith('sb_secret_')) return true;

  const parts = key.split('.');
  if (parts.length !== 3) return false;
  try {
    const base64 = (parts[1] ?? '').replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))) as {
      role?: unknown;
    };
    return payload.role === 'service_role';
  } catch {
    return false;
  }
}
