import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router';
import { Button } from '../../../components/ui/Button';
import FormAlert from '../../../components/ui/FormAlert';
import PasswordField from '../../../components/ui/PasswordField';
import TextField from '../../../components/ui/TextField';
import { safeRedirectPath, type SignInLocationState } from '../../../routes/redirects';
import AuthCard, { authLinkClasses } from '../components/AuthCard';
import { authErrorMessage, authService, type AuthResult } from '../authService';
import { signInSchema, type SignInValues } from '../schemas';

const RESENT = 'If that email address is waiting for confirmation, we’ve sent a new link.';

export default function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as SignInLocationState | null;
  // The notice appears only when sign-out explicitly says so — never by default.
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const signedOut = locationState?.signedOut === true && !noticeDismissed;
  const [failure, setFailure] = useState<AuthResult>();
  const [resend, setResend] = useState<{
    sending: boolean;
    message?: string;
    tone?: 'info' | 'error';
  }>({ sending: false });
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setNoticeDismissed(true);
    setFailure(undefined);
    setResend({ sending: false });
    const result = await authService.signIn(values);
    if (result.kind === 'ok') {
      // Back to the page the rider originally asked for — internal paths only.
      navigate(safeRedirectPath(locationState?.from), { replace: true });
      return;
    }
    setFailure(result);
  });

  // Only offered after Supabase has confirmed the password was correct.
  const resendConfirmation = async () => {
    if (resend.sending) return;
    setResend({ sending: true });
    const result = await authService.resendConfirmation({ email: getValues('email').trim() });
    setResend(
      result.kind === 'ok'
        ? { sending: false, tone: 'info', message: RESENT }
        : { sending: false, tone: 'error', message: authErrorMessage(result) },
    );
  };

  return (
    <AuthCard
      title="Sign in"
      description="Welcome back to Lobby."
      footer={
        <>
          New to Lobby?{' '}
          <Link to="/sign-up" className={authLinkClasses}>
            Create an account
          </Link>
        </>
      }
    >
      <form noValidate onSubmit={onSubmit} className="space-y-5">
        <FormAlert tone="success" message={signedOut ? 'You’ve signed out.' : undefined} />
        <FormAlert tone="error" message={failure ? authErrorMessage(failure) : undefined} />
        {failure?.kind === 'email_not_confirmed' && (
          <div className="space-y-3">
            <FormAlert tone={resend.tone} message={resend.message} />
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              loading={resend.sending}
              loadingLabel="Sending…"
              onClick={resendConfirmation}
            >
              Resend confirmation email
            </Button>
          </div>
        )}
        <TextField
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          error={errors.email?.message}
          {...register('email')}
        />
        <div>
          <PasswordField
            label="Password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <p className="mt-2 text-right text-sm">
            <Link to="/forgot-password" className={authLinkClasses}>
              Forgot password?
            </Link>
          </p>
        </div>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          loading={isSubmitting}
          loadingLabel="Signing in…"
        >
          Sign in
        </Button>
      </form>
    </AuthCard>
  );
}
