import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router';
import { Button, ButtonLink } from '../../../components/ui/Button';
import FormAlert from '../../../components/ui/FormAlert';
import PasswordField from '../../../components/ui/PasswordField';
import AuthCard, { authLinkClasses } from '../components/AuthCard';
import {
  authErrorMessage,
  authService,
  readEmailLink,
  RECOVERY_LINK_TYPES,
  type AuthResult,
} from '../authService';
import { PASSWORD_MIN_LENGTH, resetPasswordSchema, type ResetPasswordValues } from '../schemas';
import { useAuth } from '../useAuth';

const RETRYABLE: AuthResult['kind'][] = ['network_error', 'rate_limited', 'error'];

function NewLinkFooter() {
  return (
    <Link to="/forgot-password" className={authLinkClasses}>
      Need a new reset link?
    </Link>
  );
}

export default function ResetPasswordPage() {
  const auth = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [link] = useState(() => readEmailLink(searchParams, RECOVERY_LINK_TYPES));
  const hadLinkParams = useState(
    () => searchParams.has('token_hash') || searchParams.has('type'),
  )[0];
  const [linkResult, setLinkResult] = useState<AuthResult>();
  const [verifying, setVerifying] = useState(false);
  const inFlight = useRef(false);
  const [updated, setUpdated] = useState(false);
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

  // Remove the one-time token from the address bar once it has been read.
  useEffect(() => {
    if (searchParams.has('token_hash') || searchParams.has('type')) {
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Deliberate action: the recovery token is only used when the rider presses
  // the button, never on page load.
  const verifyLink = async () => {
    if (!link || inFlight.current) return;
    inFlight.current = true;
    setVerifying(true);
    setLinkResult(undefined);
    setLinkResult(await authService.verifyEmailLink(link));
    setVerifying(false);
    inFlight.current = false;
  };

  const onSubmit = handleSubmit(async (values) => {
    setNotice(undefined);
    const result = await authService.updatePassword(values);
    if (result.kind === 'ok') {
      // Sign out this device so the rider proves the new password by signing in.
      await authService.signOut();
      setUpdated(true);
      return;
    }
    setNotice(authErrorMessage(result));
  });

  // Only a genuine `ok` from Supabase shows this.
  if (updated) {
    return (
      <AuthCard title="Password updated">
        <FormAlert tone="success" message="Your password has been changed. Please sign in again." />
        <ButtonLink to="/sign-in" variant="primary" size="lg" className="mt-6 w-full">
          Sign in
        </ButtonLink>
      </AuthCard>
    );
  }

  const linkUnusable = (hadLinkParams && !link) || linkResult?.kind === 'invalid_or_expired_link';
  if (linkUnusable && auth.status !== 'signedIn') {
    return (
      <AuthCard title="Link can’t be used" footer={<NewLinkFooter />}>
        <FormAlert
          tone="error"
          message={
            link
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

  // The new-password form needs a session: from the verified recovery link,
  // or because the rider is already signed in on this device.
  if (auth.status === 'signedIn') {
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

  if (link) {
    return (
      <AuthCard
        title="Reset your password"
        description="Press the button to continue resetting your Lobby password."
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
            loading={verifying || (linkResult?.kind === 'ok' && auth.status === 'loading')}
            loadingLabel="Checking link…"
            onClick={verifyLink}
          >
            {linkResult ? 'Try again' : 'Continue'}
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Reset your password" footer={<NewLinkFooter />}>
      <p className="text-ink-muted">
        To choose a new password, open the reset link we emailed you. If you don’t have one, you can
        request a new link.
      </p>
      <ButtonLink to="/forgot-password" variant="secondary" size="lg" className="mt-6 w-full">
        Request a reset link
      </ButtonLink>
    </AuthCard>
  );
}
