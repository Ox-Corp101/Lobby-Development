import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../features/auth/useAuth';
import { DEFAULT_SIGNED_IN_PATH, safeRedirectPath, type SignInLocationState } from './redirects';

function CheckingSession() {
  return (
    <p role="status" className="mx-auto max-w-md px-4 py-16 text-center text-ink-muted">
      Checking your session…
    </p>
  );
}

/** Pages that require a signed-in rider. Signed-out visitors go to /sign-in and come back after. */
export function ProtectedRoute() {
  const auth = useAuth();
  const location = useLocation();

  if (auth.status === 'loading') return <CheckingSession />;
  if (auth.status === 'signedOut') {
    const state: SignInLocationState = {
      from: `${location.pathname}${location.search}${location.hash}`,
    };
    return <Navigate to="/sign-in" replace state={state} />;
  }
  return <Outlet />;
}

/** Pages only for signed-out visitors (sign-in, sign-up). Signed-in riders are sent on. */
export function GuestOnlyRoute() {
  const auth = useAuth();
  const location = useLocation();

  if (auth.status === 'loading') return <CheckingSession />;
  if (auth.status === 'signedIn') {
    const from = (location.state as SignInLocationState | null)?.from;
    return <Navigate to={from ? safeRedirectPath(from) : DEFAULT_SIGNED_IN_PATH} replace />;
  }
  return <Outlet />;
}
