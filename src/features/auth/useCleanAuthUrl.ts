import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { hasAuthParams } from './authService';

/**
 * Removes auth codes, tokens and errors (query string AND #fragment) from the
 * address bar, replacing the current history entry so they don't remain in
 * browser history. Runs whenever `ready` is true and auth values are present.
 *
 * Pages set `ready` only once the values are no longer needed — e.g. after a
 * PKCE code has been exchanged — so a required code is never removed early.
 */
export function useCleanAuthUrl(ready: boolean) {
  const location = useLocation();
  const navigate = useNavigate();
  const dirty = hasAuthParams(location);

  useEffect(() => {
    if (ready && dirty) {
      navigate({ pathname: location.pathname }, { replace: true, state: location.state });
    }
  }, [ready, dirty, location.pathname, location.state, navigate]);
}
