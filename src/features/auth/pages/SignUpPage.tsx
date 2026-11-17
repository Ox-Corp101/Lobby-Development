import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { Button } from '../../../components/ui/Button';
import FormAlert from '../../../components/ui/FormAlert';
import PasswordField from '../../../components/ui/PasswordField';
import TextField from '../../../components/ui/TextField';
import AuthCard, { authLinkClasses } from '../components/AuthCard';
import { authErrorMessage, authService } from '../authService';
import { PASSWORD_MIN_LENGTH, signUpSchema, type SignUpValues } from '../schemas';

export default function SignUpPage() {
  const navigate = useNavigate();
  const [notice, setNotice] = useState<{ tone: 'info' | 'error'; text: string }>();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setNotice(undefined);
    const result = await authService.signUp(values);
    if (result.kind === 'ok') {
      // Same destination whether or not the email already had an account.
      navigate('/check-email');
      return;
    }
    setNotice({ tone: 'error', text: authErrorMessage(result) });
  });

  return (
    <AuthCard
      title="Create your account"
      description="Join Lobby with your email address."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/sign-in" className={authLinkClasses}>
            Sign in
          </Link>
        </>
      }
    >
      <form noValidate onSubmit={onSubmit} className="space-y-5">
        <FormAlert tone={notice?.tone} message={notice?.text} />
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
        <PasswordField
          label="Password"
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
          loadingLabel="Creating account…"
        >
          Create account
        </Button>
      </form>
    </AuthCard>
  );
}
