import { z } from 'zod';

/**
 * Password length limits.
 * MAX is PROVISIONAL: Supabase's hashing limit is believed to be 72 characters.
 * It must be verified against Supabase in Step 4 before integration.
 */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

const email = z
  .string()
  .trim()
  .min(1, 'Enter your email address')
  .max(254, 'Email address is too long')
  .pipe(z.email('Enter a valid email address'));

// New passwords (sign-up, reset): length rules only — no composition rules.
const newPassword = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH, `Password must be ${PASSWORD_MAX_LENGTH} characters or fewer`);

// Existing passwords (sign-in): only check that something was entered, so the
// form never hints at which passwords would be valid.
const currentPassword = z.string().min(1, 'Enter your password');

export const signUpSchema = z.object({ email, password: newPassword });
export const signInSchema = z.object({ email, password: currentPassword });
export const forgotPasswordSchema = z.object({ email });
export const resetPasswordSchema = z.object({ password: newPassword });

export type SignUpValues = z.infer<typeof signUpSchema>;
export type SignInValues = z.infer<typeof signInSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
