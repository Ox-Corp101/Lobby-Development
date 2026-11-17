import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ButtonLink } from '../../../components/ui/Button';
import FormAlert from '../../../components/ui/FormAlert';
import AuthCard, { authLinkClasses } from '../components/AuthCard';
import { authErrorMessage, authService, type AuthResult } from '../authService';

export default function ConfirmEmailPage() {
  const [searchParams] = useSearchParams();
  const [result, setResult] = useState<AuthResult>();
  // Confirmation links are single-use: make sure the check runs only once,
  // even when React re-runs effects in development (StrictMode).
  const request = useRef<Promise<AuthResult> | null>(null);

  useEffect(() => {
    let active = true;
    request.current ??= authService.confirmEmail(searchParams);
    request.current.then((value) => {
      if (active) setResult(value);
    });
    return () => {
      active = false;
    };
  }, [searchParams]);

  if (!result) {
    return (
      <AuthCard title="Confirming your email">
        <p role="status" className="flex items-center gap-3 text-ink-muted">
          <svg
            viewBox="0 0 24 24"
            className="size-5 animate-spin"
            fill="none"
            aria-hidden="true"
            focusable="false"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeOpacity="0.3"
              strokeWidth="3"
            />
            <path
              d="M21 12a9 9 0 0 0-9-9"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          Checking your confirmation link…
        </p>
      </AuthCard>
    );
  }

  // Only a genuine `ok` from the auth service shows the confirmed state.
  if (result.kind === 'ok') {
    return (
      <AuthCard title="Email confirmed" description="Your email address is confirmed.">
        <FormAlert tone="success" message="You’re all set." />
        <ButtonLink to="/profile" variant="primary" size="lg" className="mt-6 w-full">
          Continue
        </ButtonLink>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Confirm your email"
      footer={
        <Link to="/sign-in" className={authLinkClasses}>
          Go to sign in
        </Link>
      }
    >
      <FormAlert
        tone={result.kind === 'not_connected' ? 'info' : 'error'}
        message={authErrorMessage(result)}
      />
    </AuthCard>
  );
}
