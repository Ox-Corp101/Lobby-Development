import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { Button, ButtonLink } from '../../../components/ui/Button';
import FormAlert from '../../../components/ui/FormAlert';
import PasswordField from '../../../components/ui/PasswordField';
import AuthCard, { authLinkClasses } from '../components/AuthCard';
import { authErrorMessage, authService } from '../authService';
import { PASSWORD_MIN_LENGTH, resetPasswordSchema, type ResetPasswordValues } from '../schemas';

export default function ResetPasswordPage() {
  const [updated, setUpdated] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'info' | 'error'; text: string }>();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onTouched',
    defaultValues: { password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setNotice(undefined);
    const result = await authService.updatePassword(values);
    if (result.kind === 'ok') {
      setUpdated(true);
      return;
    }
    setNotice({
      tone: result.kind === 'not_connected' ? 'info' : 'error',
      text: authErrorMessage(result),
    });
  });

  // Only a genuine `ok` from the auth service shows this.
  if (updated) {
    return (
      <AuthCard title="Password updated">
        <FormAlert tone="success" message="Your password has been changed." />
        <ButtonLink to="/sign-in" variant="primary" size="lg" className="mt-6 w-full">
          Sign in
        </ButtonLink>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Choose a new password"
      footer={
        <Link to="/forgot-password" className={authLinkClasses}>
          Need a new reset link?
        </Link>
      }
    >
      <form noValidate onSubmit={onSubmit} className="space-y-5">
        <FormAlert tone={notice?.tone} message={notice?.text} />
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
