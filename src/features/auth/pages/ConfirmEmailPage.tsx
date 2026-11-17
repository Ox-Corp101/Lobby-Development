import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Button, ButtonLink } from '../../../components/ui/Button';
import FormAlert from '../../../components/ui/FormAlert';
import AuthCard, { authLinkClasses } from '../components/AuthCard';
import {
  authErrorMessage,
  authService,
  CONFIRM_LINK_TYPES,
  readEmailLink,
  type AuthResult,
} from '../authService';

/** Results where pressing the button again could succeed. */
const RETRYABLE: AuthResult['kind'][] = ['network_error', 'rate_limited', 'error'];

export default function ConfirmEmailPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  // Read the link once, then remove the token from the address bar so it
  // doesn't linger in browser history. Reopening the email link still works.
  const [link] = useState(() => readEmailLink(searchParams, CONFIRM_LINK_TYPES));
  const [result, setResult] = useState<AuthResult>();
  const [verifying, setVerifying] = useState(false);
  // Run-once guard: blocks double-clicks while a check is in flight, but is
  // released afterwards so a failed attempt can be retried.
  const inFlight = useRef(false);

  useEffect(() => {
    if (searchParams.has('token_hash') || searchParams.has('type')) {
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Nothing is verified on page load: the rider must press the button. This
  // stops email security scanners that pre-open links from using up the token.
  const confirm = async () => {
    if (!link || inFlight.current) return;
    inFlight.current = true;
    setVerifying(true);
    setResult(undefined);
    const outcome = await authService.verifyEmailLink(link);
    setResult(outcome);
    setVerifying(false);
    inFlight.current = false;
  };

  // Only a genuine `ok` from Supabase shows the confirmed state.
  if (result?.kind === 'ok') {
    return (
      <AuthCard title="Email confirmed" description="Your email address is confirmed.">
        <FormAlert tone="success" message="You’re signed in and ready to go." />
        <ButtonLink to="/profile" variant="primary" size="lg" className="mt-6 w-full">
          Continue
        </ButtonLink>
      </AuthCard>
    );
  }

  const linkUnusable = !link || result?.kind === 'invalid_or_expired_link';
  if (linkUnusable) {
    return (
      <AuthCard
        title="Link can’t be used"
        footer={
          <Link to="/sign-in" className={authLinkClasses}>
            Go to sign in
          </Link>
        }
      >
        <FormAlert
          tone="error"
          message={
            link
              ? authErrorMessage({ kind: 'invalid_or_expired_link' })
              : 'This confirmation link is incomplete or invalid.'
          }
        />
        <p className="mt-4 text-ink-muted">
          If your email is already confirmed, you can sign in. Otherwise, request a new confirmation
          link.
        </p>
        <ButtonLink to="/check-email" variant="secondary" size="lg" className="mt-6 w-full">
          Get a new confirmation link
        </ButtonLink>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Confirm your email"
      description="Press the button to finish confirming your Lobby account."
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
          loading={verifying}
          loadingLabel="Confirming…"
          onClick={confirm}
        >
          {result ? 'Try again' : 'Confirm my email'}
        </Button>
      </div>
    </AuthCard>
  );
}
