import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation } from 'react-router';
import { Button, ButtonLink } from '../../../components/ui/Button';
import FormAlert from '../../../components/ui/FormAlert';
import PasswordField from '../../../components/ui/PasswordField';
import AuthCard, { authLinkClasses } from '../components/AuthCard';
import {
  authErrorMessage,
  authService,
  readAuthCallback,
  recoveryMarker,
  RECOVERY_LINK_TYPES,
  type AuthResult,
} from '../authService';
import { PASSWORD_MIN_LENGTH, resetPasswordSchema, type ResetPasswordValues } from '../schemas';
import { useAuth } from '../useAuth';
import { useCleanAuthUrl } from '../useCleanAuthUrl';

const RETRYABLE: AuthResult['kind'][] = ['network_error', 'rate_limited', 'error'];

function NewLinkFooter() {
  return (
    <Link to="/forgot-password" className={authLinkClasses}>
      Need a new reset link?
    </Link>
  );
}

function Checking() {
  return (
    <AuthCard title="Reset your password">
      <p role="status" className="text-ink-muted">
        Checking your reset link…
      </p>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  const auth = useAuth();
  const location = useLocation();
  // Read the address exactly once; everything below works from this copy.
  const [callback] = useState(() => readAuthCallback(location, RECOVERY_LINK_TYPES));
  const [linkResult, setLinkResult] = useState<AuthResult>();
  const [verifying, setVerifying] = useState(callback.kind === 'code');
  const inFlight = useRef(false);
  // After a successful change: whether every session (all devices) was signed out.
  const [updated, setUpdated] = useState<{ allDevices: boolean }>();
  const [notice, setNotice] = useState<string>();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onTouched',
    defaultValues: { password: '' },
  });

  // PKCE recovery code (Supabase's default reset email): exchange automatically,
  // once. It only works with the verifier stored in this browser when the reset
  // was requested; success starts a recovery session for choosing a new password.
  useEffect(() => {
    if (callback.kind !== 'code') return;
    let active = true;
    void authService.exchangeCode(callback.code, callback.flowId).then(async (outcome) => {
      // Mark this tab as being in a genuine recovery (S1) before showing the form.
      if (outcome.kind === 'ok') await authService.markRecoverySession();
      if (!active) return;
      setLinkResult(outcome);
      setVerifying(false);
    });
    return () => {
      active = false;
    };
  }, [callback]);

  // Clean the address bar and history. A PKCE code is removed only after its
  // single exchange attempt has finished — after any outcome it can't be used
  // again (supabase-js deletes the verifier) — so it's never removed early.
  useCleanAuthUrl(callback.kind !== 'code' || linkResult !== undefined);

  // Token-hash links only (a PKCE code can't be retried).
  const verifyLink = async () => {
    if (callback.kind !== 'token_hash' || inFlight.current) return;
    inFlight.current = true;
    setVerifying(true);
    setLinkResult(undefined);
    const outcome = await authService.verifyEmailLink(callback.link);
    setLinkResult(outcome);
    setVerifying(false);
    inFlight.current = false;
  };

  const onSubmit = handleSubmit(async (values) => {
    setNotice(undefined);
    const result = await authService.updatePassword(values);
    if (result.kind === 'ok') {
      // S2: sign out every session of this account (all devices, including this
      // one), so anyone else using the old password loses access. Falls back to
      // this device only if that fails.
      const signOut = await authService.signOutEverywhere();
      setUpdated({ allDevices: signOut.kind === 'ok' });
      return;
    }
    setNotice(authErrorMessage(result));
  });

  // Only a genuine `ok` from Supabase shows this.
  if (updated) {
    return (
      <AuthCard title="Password updated">
        <FormAlert
          tone="success"
          message={
            updated.allDevices
              ? 'Your password has been changed and you’ve been signed out on all devices. Please sign in again.'
              : 'Your password has been changed. Please sign in again.'
          }
        />
        {!updated.allDevices && (
          <p className="mt-4 text-ink-muted">
            We couldn’t confirm that your other devices were signed out. If you’re concerned, check
            your connection and reset your password again.
          </p>
        )}
        <ButtonLink to="/sign-in" variant="primary" size="lg" className="mt-6 w-full">
          Sign in
        </ButtonLink>
      </AuthCard>
    );
  }

  // Recovery code opened in another browser: no verifier here, so no session.
  if (linkResult?.kind === 'different_browser') {
    return (
      <AuthCard title="Open the link in the same browser" footer={<NewLinkFooter />}>
        <FormAlert tone="error" message={authErrorMessage(linkResult)} />
        <p className="mt-4 text-ink-muted">
          For your security, a password reset link works only once, and only in the browser where
          you requested it. Open your newest reset email in that browser, or request a new reset
          link from this browser.
        </p>
        <ButtonLink to="/forgot-password" variant="secondary" size="lg" className="mt-6 w-full">
          Request a new reset link
        </ButtonLink>
      </AuthCard>
    );
  }

  // The single PKCE exchange failed for a temporary reason. The code is now
  // unusable in this browser, so the rider needs a new reset link.
  if (callback.kind === 'code' && linkResult && RETRYABLE.includes(linkResult.kind)) {
    return (
      <AuthCard title="We couldn’t check your reset link" footer={<NewLinkFooter />}>
        <FormAlert
          tone="error"
          message={
            linkResult.kind === 'network_error'
              ? 'We couldn’t reach Lobby while checking this link.'
              : 'Something went wrong while checking this link.'
          }
        />
        <p className="mt-4 text-ink-muted">
          This reset link can’t be used again. Check your connection, then request a new reset link
          from this browser.
        </p>
        <ButtonLink to="/forgot-password" variant="secondary" size="lg" className="mt-6 w-full">
          Request a new reset link
        </ButtonLink>
      </AuthCard>
    );
  }

  const unusable =
    callback.kind === 'malformed' ||
    callback.kind === 'implicit_fragment' ||
    callback.kind === 'error' ||
    linkResult?.kind === 'invalid_or_expired_link';
  if (unusable) {
    const expired =
      linkResult?.kind === 'invalid_or_expired_link' ||
      (callback.kind === 'error' && callback.result.kind === 'invalid_or_expired_link');
    return (
      <AuthCard title="Link can’t be used" footer={<NewLinkFooter />}>
        <FormAlert
          tone="error"
          message={
            expired
              ? authErrorMessage({ kind: 'invalid_or_expired_link' })
              : 'This reset link is incomplete or invalid.'
          }
        />
        <ButtonLink to="/forgot-password" variant="secondary" size="lg" className="mt-6 w-full">
          Request a new reset link
        </ButtonLink>
      </AuthCard>
    );
  }

  // A recovery code is still being exchanged: wait for Supabase's answer before
  // showing anything else (even to a rider who is already signed in).
  if (callback.kind === 'code' && verifying && !linkResult) {
    return <Checking />;
  }

  // S1: the new-password form is shown ONLY during a genuine recovery — a
  // recovery link processed in this tab within the last 60 minutes, for the
  // signed-in user. Never to an ordinary signed-in session.
  const inRecovery = auth.status === 'signedIn' && recoveryMarker.isValidFor(auth.session.user.id);
  if (inRecovery) {
    return (
      <AuthCard title="Choose a new password" footer={<NewLinkFooter />}>
        <form noValidate onSubmit={onSubmit} className="space-y-5">
          <FormAlert tone="error" message={notice} />
          <PasswordField
            label="New password"
            hint={`At least ${PASSWORD_MIN_LENGTH} characters.`}
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={isSubmitting}
            loadingLabel="Updating password…"
          >
            Update password
          </Button>
        </form>
      </AuthCard>
    );
  }

  // Code exchanged; waiting for the new recovery session to register.
  if (linkResult?.kind === 'ok') {
    return <Checking />;
  }

  // Token-hash link (custom templates, later): button press, retry possible.
  if (callback.kind === 'token_hash') {
    return (
      <AuthCard
        title="Reset your password"
        description={
          callback.kind === 'token_hash' && !linkResult
            ? 'Press the button to continue resetting your Lobby password.'
            : undefined
        }
        footer={<NewLinkFooter />}
      >
        <div className="space-y-5">
          <FormAlert
            tone="error"
            message={
              linkResult && RETRYABLE.includes(linkResult.kind)
                ? authErrorMessage(linkResult)
                : undefined
            }
          />
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            loading={verifying}
            loadingLabel="Checking link…"
            onClick={verifyLink}
          >
            {linkResult ? 'Try again' : 'Continue'}
          </Button>
        </div>
      </AuthCard>
    );
  }

  // Signed in normally (not via a recovery link): no form. Changing the password
  // requires proving access to the email account.
  if (auth.status === 'signedIn') {
    return (
      <AuthCard title="Change your password">
        <p className="text-ink-muted">
          For your security, changing your password requires a reset link sent to your email.
        </p>
        <ButtonLink to="/forgot-password" variant="primary" size="lg" className="mt-6 w-full">
          Email me a reset link
        </ButtonLink>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Reset your password" footer={<NewLinkFooter />}>
      <p className="text-ink-muted">
        To choose a new password, open the reset link we emailed you{' '}
        <strong className="text-ink">in this same browser</strong>. If you don’t have one, you can
        request a new link.
      </p>
      <ButtonLink to="/forgot-password" variant="secondary" size="lg" className="mt-6 w-full">
        Request a reset link
      </ButtonLink>
    </AuthCard>
  );
}
