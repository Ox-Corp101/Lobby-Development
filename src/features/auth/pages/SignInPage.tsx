import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router';
import { Button } from '../../../components/ui/Button';
import FormAlert from '../../../components/ui/FormAlert';
import PasswordField from '../../../components/ui/PasswordField';
import TextField from '../../../components/ui/TextField';
import AuthCard, { authLinkClasses } from '../components/AuthCard';
import { authErrorMessage, authService } from '../authService';
import { signInSchema, type SignInValues } from '../schemas';

/** Navigation state that sign-out passes explicitly (Step 4). */
export type SignInLocationState = { signedOut?: boolean };

export default function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  // The notice appears only when sign-out explicitly says so — never by default.
  const signedOut = (location.state as SignInLocationState | null)?.signedOut === true;
  const [error, setError] = useState<string>();
  const [notConnected, setNotConnected] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(undefined);
    setNotConnected(false);
    const result = await authService.signIn(values);
    if (result.kind === 'ok') {
      navigate('/profile');
      return;
    }
    if (result.kind === 'not_connected') setNotConnected(true);
    else setError(authErrorMessage(result));
  });

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
        <FormAlert tone="error" message={error} />
        <FormAlert
          tone="info"
          message={notConnected ? authErrorMessage({ kind: 'not_connected' }) : undefined}
        />
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
