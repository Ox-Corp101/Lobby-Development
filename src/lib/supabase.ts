import { createClient } from '@supabase/supabase-js';
import { readSupabaseConfig } from './env';

/** Result of checking .env.local. The app shows a configuration screen when not ok. */
export const supabaseConfig = readSupabaseConfig(import.meta.env);

/**
 * The single Supabase client for the app, or null when not configured.
 * Uses only the Project URL and the publishable key — never a secret key.
 * Sessions persist in localStorage (approved) and refresh automatically.
 * Email links are verified explicitly by our own pages (token-hash flow), so
 * the client must not try to read sessions from the URL by itself.
 */
export const supabase = supabaseConfig.ok
  ? createClient(supabaseConfig.config.url, supabaseConfig.config.publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;
