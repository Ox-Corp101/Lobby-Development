import { createContext, useContext } from 'react';
import type { Session } from '@supabase/supabase-js';

export type AuthState =
  | { status: 'loading'; session: null }
  | { status: 'signedIn'; session: Session }
  | { status: 'signedOut'; session: null };

export const AuthContext = createContext<AuthState>({ status: 'loading', session: null });

/** Current sign-in state. `loading` until Supabase has reported the stored session. */
export function useAuth(): AuthState {
  return useContext(AuthContext);
}
