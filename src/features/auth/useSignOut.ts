import { useState } from 'react';
import { useNavigate } from 'react-router';
import type { SignInLocationState } from '../../routes/redirects';
import { authService } from './authService';

/**
 * Signs out of this device only, then shows the sign-in page with the
 * "You've signed out" notice. If sign-out fails, the rider stays where they
 * are and `failed` is set so the UI can say so.
 */
export function useSignOut() {
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const [failed, setFailed] = useState(false);

  const signOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    setFailed(false);
    const result = await authService.signOut();
    setSigningOut(false);
    if (result.kind !== 'ok') {
      setFailed(true);
      return;
    }
    const state: SignInLocationState = { signedOut: true };
    navigate('/sign-in', { replace: true, state });
  };

  return { signOut, signingOut, failed };
}
