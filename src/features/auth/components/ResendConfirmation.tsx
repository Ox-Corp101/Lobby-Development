import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../../components/ui/Button';
import FormAlert from '../../../components/ui/FormAlert';
import TextField from '../../../components/ui/TextField';
import { authErrorMessage, authService } from '../authService';
import { emailOnlySchema, type EmailOnlyValues } from '../schemas';

// Neutral: identical whether or not the address has an unconfirmed account.
const SENT = 'If that email address is waiting for confirmation, we’ve sent a new link.';

/** "Resend confirmation email" form, used on the check-email page. */
export default function ResendConfirmation({ defaultEmail = '' }: { defaultEmail?: string }) {
  const [notice, setNotice] = useState<{ tone: 'info' | 'error'; text: string }>();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmailOnlyValues>({
    resolver: zodResolver(emailOnlySchema),
    mode: 'onTouched',
    defaultValues: { email: defaultEmail },
  });

  const onSubmit = handleSubmit(async (values) => {
    setNotice(undefined);
    const result = await authService.resendConfirmation(values);
    setNotice(
      result.kind === 'ok'
        ? { tone: 'info', text: SENT }
        : { tone: 'error', text: authErrorMessage(result) },
    );
  });

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-4">
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
        variant="secondary"
        size="lg"
        className="w-full"
        loading={isSubmitting}
        loadingLabel="Sending…"
      >
        Resend confirmation email
      </Button>
    </form>
  );
}
