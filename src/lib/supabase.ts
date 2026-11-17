import { createClient } from '@supabase/supabase-js';
import { readSupabaseConfig } from './env';

/** Result of checking .env.local. The app shows a configuration screen when not ok. */
export const supabaseConfig = readSupabaseConfig(import.meta.env);

/**
 * The single Supabase client for the app, or null when not configured.
 * Uses only the Project URL and the publishable key — never a secret key.
 * Sessions persist in localStorage (approved) and refresh automatically.
 *
 * flowType 'pkce': when Supabase's default email templates redirect back to
 * Lobby, they carry a short-lived single-use `?code=` that only works together
 * with a secret verifier stored in the browser that started sign-up or the
 * password reset — never live tokens in the URL.
 *
 * detectSessionInUrl false: the client never reads sessions from the URL by
 * itself. Only /auth/confirm and /reset-password process callback codes,
 * explicitly, and tokens in URL fragments (#access_token=…) are never accepted.
 */
export const supabase = supabaseConfig.ok
  ? createClient(supabaseConfig.config.url, supabaseConfig.config.publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: 'pkce',
      },
    })
  : null;
