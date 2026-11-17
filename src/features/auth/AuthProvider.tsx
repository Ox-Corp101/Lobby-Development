import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { AuthContext, type AuthState } from './useAuth';

/**
 * Tracks whether a rider is signed in.
 *
 * Relies only on Supabase's auth-state listener, which reports the stored
 * session once on start-up (INITIAL_SESSION) and then every change — sign-in,
 * sign-out, token refresh — including changes made in other tabs. There is no
 * separate polling or duplicate session request.
 */
export default function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading', session: null });

  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((_event, session: Session | null) => {
      // Only update React state here: Supabase advises against calling other
      // Supabase methods inside this callback.
      setState(session ? { status: 'signedIn', session } : { status: 'signedOut', session: null });
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return <AuthContext value={state}>{children}</AuthContext>;
}
