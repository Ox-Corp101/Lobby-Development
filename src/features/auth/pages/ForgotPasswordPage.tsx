import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { Button } from '../../../components/ui/Button';
import FormAlert from '../../../components/ui/FormAlert';
import TextField from '../../../components/ui/TextField';
import AuthCard, { authLinkClasses } from '../components/AuthCard';
import { authErrorMessage, authService } from '../authService';
import { forgotPasswordSchema, type ForgotPasswordValues } from '../schemas';

// Neutral reply: identical whether or not the email has an account.
const SENT_MESSAGE =
  'If an account exists for that email, we’ve sent a link to reset your password.';

export default function ForgotPasswordPage() {
  const [notice, setNotice] = useState<{ tone: 'info' | 'error'; text: string }>();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onTouched',
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setNotice(undefined);
    const result = await authService.requestPasswordReset(values);
    if (result.kind === 'ok') setNotice({ tone: 'info', text: SENT_MESSAGE });
    else
      setNotice({
        tone: result.kind === 'not_connected' ? 'info' : 'error',
        text: authErrorMessage(result),
      });
  });

  return (
    <AuthCard
      title="Reset your password"
      description="Enter your email and we’ll send you a link to choose a new password."
      footer={
        <Link to="/sign-in" className={authLinkClasses}>
          Back to sign in
        </Link>
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
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          loading={isSubmitting}
          loadingLabel="Sending link…"
        >
          Send reset link
        </Button>
      </form>
    </AuthCard>
  );
}
