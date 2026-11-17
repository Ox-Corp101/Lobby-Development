import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Button, ButtonLink } from '../../../components/ui/Button';
import FormAlert from '../../../components/ui/FormAlert';
import AuthCard, { authLinkClasses } from '../components/AuthCard';
import {
  authErrorMessage,
  authService,
  CONFIRM_LINK_TYPES,
  readAuthCallback,
  type AuthResult,
} from '../authService';
import { useAuth } from '../useAuth';
import { useCleanAuthUrl } from '../useCleanAuthUrl';

/** Results where trying again could succeed. */
const RETRYABLE: AuthResult['kind'][] = ['network_error', 'rate_limited', 'error'];

function Spinner() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5 animate-spin"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function ConfirmEmailPage() {
  const location = useLocation();
  const auth = useAuth();
  // Read the address exactly once; everything below works from this copy.
  const [callback] = useState(() => readAuthCallback(location, CONFIRM_LINK_TYPES));
  const [result, setResult] = useState<AuthResult>();
  const [busy, setBusy] = useState(callback.kind === 'code');
  const inFlight = useRef(false);

  // PKCE code (Supabase's default email): exchange automatically, once.
  // Supabase has already used up the email link itself; this code only works
  // together with the secret verifier stored in this browser at sign-up.
  useEffect(() => {
    if (callback.kind !== 'code') return;
    let active = true;
    void authService.exchangeCode(callback.code, callback.flowId).then((outcome) => {
      if (!active) return;
      setResult(outcome);
      setBusy(false);
    });
    return () => {
      active = false;
    };
  }, [callback]);

  // Remove codes/tokens from the address bar and history:
  // - immediately for anything we don't need (fragments, errors, token_hash —
  //   the latter is held in memory until the rider presses the button);
  // - for a PKCE code, as soon as its single exchange attempt has finished.
  //   After any outcome the code can't be used again (supabase-js deletes the
  //   verifier), so it's never removed before it has been processed.
  useCleanAuthUrl(callback.kind !== 'code' || result !== undefined);

  // Token-hash links only (a PKCE code can't be retried).
  const verifyTokenHash = async () => {
    if (callback.kind !== 'token_hash' || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setResult(undefined);
    const outcome = await authService.verifyEmailLink(callback.link);
    setResult(outcome);
    setBusy(false);
    inFlight.current = false;
  };

  const signInFooter = (
    <Link to="/sign-in" className={authLinkClasses}>
      Go to sign in
    </Link>
  );

  // Only a genuine `ok` from Supabase shows the confirmed, signed-in state.
  // A rider who returns here (e.g. Back/Forward) while signed in is also
  // confirmed: Supabase only allows sign-in after the email is confirmed.
  if (result?.kind === 'ok' || (callback.kind === 'none' && auth.status === 'signedIn')) {
    return (
      <AuthCard title="Email confirmed" description="Your email address is confirmed.">
        <FormAlert tone="success" message="You’re signed in and ready to go." />
        <ButtonLink to="/profile" variant="primary" size="lg" className="mt-6 w-full">
          Continue
        </ButtonLink>
      </AuthCard>
    );
  }

  // No verifier for this code in this browser (another browser, or the code was
  // already used here). Supabase confirmed the email before redirecting, but no
  // session can be created here.
  if (result?.kind === 'different_browser') {
    return (
      <AuthCard title="Sign in to continue">
        <FormAlert
          tone="success"
          message="If you opened this link from your Lobby confirmation email, your email address is now confirmed."
        />
        <p className="mt-4 text-ink-muted">
          We couldn’t sign you in automatically. This happens when the link is opened in a different
          browser from the one you signed up in, or when it has already been used. Sign in with your
          email and password to continue.
        </p>
        <ButtonLink to="/sign-in" variant="primary" size="lg" className="mt-6 w-full">
          Sign in
        </ButtonLink>
      </AuthCard>
    );
  }

  // Old-format link with tokens in the #fragment: never accepted. Supabase has
  // usually confirmed the email already, so point the rider to sign-in.
  if (callback.kind === 'implicit_fragment') {
    return (
      <AuthCard title="Sign in to continue" footer={signInFooter}>
        <p className="text-ink-muted">
          This link was handled by Supabase directly, so your email address may already be
          confirmed. Sign in with your email and password to continue.
        </p>
        <ButtonLink to="/sign-in" variant="primary" size="lg" className="mt-6 w-full">
          Sign in
        </ButtonLink>
      </AuthCard>
    );
  }

  if (callback.kind === 'none' && auth.status === 'loading') {
    return (
      <AuthCard title="Confirm your email">
        <p role="status" className="text-ink-muted">
          Checking…
        </p>
      </AuthCard>
    );
  }

  const expired =
    result?.kind === 'invalid_or_expired_link' ||
    (callback.kind === 'error' && callback.result.kind === 'invalid_or_expired_link');
  if (
    expired ||
    callback.kind === 'none' ||
    callback.kind === 'malformed' ||
    callback.kind === 'error'
  ) {
    return (
      <AuthCard title="Link can’t be used" footer={signInFooter}>
        <FormAlert
          tone="error"
          message={
            expired
              ? authErrorMessage({ kind: 'invalid_or_expired_link' })
              : callback.kind === 'error'
                ? 'Something went wrong with this confirmation link.'
                : 'This confirmation link is incomplete or invalid.'
          }
        />
        <p className="mt-4 text-ink-muted">
          If you’ve already confirmed your email, you can sign in. Otherwise, request a new
          confirmation email.
        </p>
        <div className="mt-6 grid gap-3">
          <ButtonLink to="/sign-in" variant="primary" size="lg" className="w-full">
            Sign in
          </ButtonLink>
          <ButtonLink to="/check-email" variant="secondary" size="lg" className="w-full">
            Get a new confirmation email
          </ButtonLink>
        </div>
      </AuthCard>
    );
  }

  // The single PKCE exchange failed for a temporary reason (offline, rate
  // limit, server error). Supabase usually confirmed the email before
  // redirecting, so guide the rider to sign in rather than claiming failure.
  if (callback.kind === 'code' && result && RETRYABLE.includes(result.kind)) {
    return (
      <AuthCard title="We couldn’t finish signing you in" footer={signInFooter}>
        <FormAlert
          tone="error"
          message={
            result.kind === 'network_error'
              ? 'We couldn’t reach Lobby while checking this link.'
              : 'Something went wrong while checking this link.'
          }
        />
        <p className="mt-4 text-ink-muted">
          If you opened this link from your Lobby confirmation email, your email address is most
          likely already confirmed. Try signing in. If sign-in says your email isn’t confirmed yet,
          request a new confirmation email.
        </p>
        <div className="mt-6 grid gap-3">
          <ButtonLink to="/sign-in" variant="primary" size="lg" className="w-full">
            Sign in
          </ButtonLink>
          <ButtonLink to="/check-email" variant="secondary" size="lg" className="w-full">
            Get a new confirmation email
          </ButtonLink>
        </div>
      </AuthCard>
    );
  }

  // PKCE code being exchanged.
  if (callback.kind === 'code' && !result) {
    return (
      <AuthCard title="Confirming your email">
        <p role="status" className="flex items-center gap-3 text-ink-muted">
          <Spinner />
          Confirming your email…
        </p>
      </AuthCard>
    );
  }

  // Token-hash link (custom templates, later): verified only when the rider
  // presses the button; retry is possible after a temporary failure.
  return (
    <AuthCard
      title="Confirm your email"
      description={
        callback.kind === 'token_hash' && !result
          ? 'Press the button to finish confirming your Lobby account.'
          : undefined
      }
    >
      <div className="space-y-5">
        <FormAlert
          tone="error"
          message={result && RETRYABLE.includes(result.kind) ? authErrorMessage(result) : undefined}
        />
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          loading={busy}
          loadingLabel="Confirming…"
          onClick={verifyTokenHash}
        >
          {result ? 'Try again' : 'Confirm my email'}
        </Button>
      </div>
    </AuthCard>
  );
}
