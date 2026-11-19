import { z } from 'zod';

/**
 * Password limits.
 * - Minimum: 8 characters (counted as user-visible characters, so an emoji is 1).
 * - Maximum: 72 UTF-8 bytes. Supabase hashes passwords with bcrypt, which works
 *   on bytes, so accented letters (2 bytes) and emoji (4 bytes) use up more of
 *   the limit. Lobby's 72-byte limit was confirmed in M0.5 (19 November 2026):
 *   Supabase accepted a 72-byte password and it works for sign-in. Passwords
 *   longer than 72 bytes are blocked by Lobby before submission, so Supabase's
 *   own handling of them remains unverified (see requirement B-4).
 * No uppercase / number / symbol requirements (approved).
 */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_BYTES = 72;

const encoder = new TextEncoder();
export const utf8ByteLength = (value: string) => encoder.encode(value).length;
const characterCount = (value: string) => Array.from(value).length;

const email = z
  .string()
  .trim()
  .min(1, 'Enter your email address')
  .max(254, 'Email address is too long')
  .pipe(z.email('Enter a valid email address'));

// New passwords (sign-up, reset): length rules only.
const newPassword = z
  .string()
  .refine((value) => characterCount(value) >= PASSWORD_MIN_LENGTH, {
    message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
  })
  .refine((value) => utf8ByteLength(value) <= PASSWORD_MAX_BYTES, {
    message:
      'Password is too long. The limit is 72 bytes — most letters count as 1, ' +
      'accented letters as 2 and emoji as 4.',
  });

// Existing passwords (sign-in): only check that something was entered, so the
// form never hints at which passwords would be valid.
const currentPassword = z.string().min(1, 'Enter your password');

export const signUpSchema = z.object({ email, password: newPassword });
export const signInSchema = z.object({ email, password: currentPassword });
export const emailOnlySchema = z.object({ email });
export const resetPasswordSchema = z.object({ password: newPassword });

export type SignUpValues = z.infer<typeof signUpSchema>;
export type SignInValues = z.infer<typeof signInSchema>;
export type EmailOnlyValues = z.infer<typeof emailOnlySchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
