import { describe, expect, it } from 'vitest';
import {
  emailOnlySchema,
  PASSWORD_MAX_BYTES,
  PASSWORD_MIN_LENGTH,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  utf8ByteLength,
} from './schemas';

const VALID_EMAIL = 'rider@example.com';
const TOO_LONG = 'Password is too long.';
const TOO_SHORT = 'Password must be at least 8 characters';

/** Messages Zod reported for one field (empty when the field is valid). */
function messagesFor(
  result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } },
  field: string,
) {
  return (result.error?.issues ?? []).filter((i) => i.path[0] === field).map((i) => i.message);
}

describe('password limits', () => {
  it('uses the approved limits', () => {
    expect(PASSWORD_MIN_LENGTH).toBe(8);
    expect(PASSWORD_MAX_BYTES).toBe(72);
  });

  it('counts UTF-8 bytes, not JavaScript characters', () => {
    expect(utf8ByteLength('a')).toBe(1);
    expect(utf8ByteLength('é')).toBe(2); // precomposed U+00E9
    expect(utf8ByteLength('é')).toBe(3); // decomposed: e + combining accent
    expect(utf8ByteLength('😀')).toBe(4);
    expect(utf8ByteLength('é'.repeat(35))).toBe(70);
    expect(utf8ByteLength('é'.repeat(36))).toBe(72);
    expect(utf8ByteLength('é'.repeat(37))).toBe(74);
  });
});

describe('new-password rules (sign-up and reset)', () => {
  const check = (password: string) =>
    messagesFor(signUpSchema.safeParse({ email: VALID_EMAIL, password }), 'password');

  it('accepts 8 plain lowercase letters (no composition rules)', () => {
    expect(check('abcdefgh')).toEqual([]);
  });

  it('rejects fewer than 8 characters', () => {
    expect(check('abcdefg')).toEqual([TOO_SHORT]);
    expect(check('')).toEqual([TOO_SHORT]);
  });

  it('counts each emoji as one character for the minimum', () => {
    expect(check('😀'.repeat(8))).toEqual([]);
    expect(check('😀'.repeat(7))).toEqual([TOO_SHORT]);
  });

  it('accepts exactly 72 bytes and rejects 73 (plain letters)', () => {
    expect(check('a'.repeat(72))).toEqual([]);
    expect(check('a'.repeat(73)).join(' ')).toContain(TOO_LONG);
  });

  it('applies the byte limit to accented letters: 35 and 36 × é pass, 37 fails', () => {
    expect(check('é'.repeat(35))).toEqual([]);
    expect(check('é'.repeat(36))).toEqual([]);
    expect(check('é'.repeat(37)).join(' ')).toContain(TOO_LONG);
  });

  it('applies the byte limit to emoji: 18 pass, 19 fail', () => {
    expect(check('😀'.repeat(18))).toEqual([]);
    expect(check('😀'.repeat(19)).join(' ')).toContain(TOO_LONG);
  });

  it('rejects 36 decomposed é (108 bytes), even though it looks like 36 letters', () => {
    expect(check('é'.repeat(36)).join(' ')).toContain(TOO_LONG);
  });

  it('uses the same rules for the reset form', () => {
    expect(resetPasswordSchema.safeParse({ password: 'é'.repeat(36) }).success).toBe(true);
    expect(resetPasswordSchema.safeParse({ password: 'é'.repeat(37) }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ password: 'abcdefg' }).success).toBe(false);
  });
});

describe('sign-in password rules', () => {
  const check = (password: string) =>
    messagesFor(signInSchema.safeParse({ email: VALID_EMAIL, password }), 'password');

  it('only requires that something was entered', () => {
    expect(check('')).toEqual(['Enter your password']);
    expect(check('x')).toEqual([]);
  });

  it('applies no maximum, so the form never hints at valid passwords', () => {
    expect(check('a'.repeat(200))).toEqual([]);
  });
});

describe('email rules', () => {
  const check = (email: string) => emailOnlySchema.safeParse({ email });

  it('accepts a valid address and trims surrounding spaces', () => {
    const result = check(`  ${VALID_EMAIL}  `);
    expect(result.success).toBe(true);
    expect(result.data?.email).toBe(VALID_EMAIL);
  });

  it('asks for an email when empty', () => {
    expect(messagesFor(check(''), 'email')).toContain('Enter your email address');
    expect(messagesFor(check('   '), 'email')).toContain('Enter your email address');
  });

  it('rejects malformed addresses', () => {
    expect(messagesFor(check('not-an-email'), 'email')).toContain('Enter a valid email address');
  });

  it('rejects addresses longer than 254 characters', () => {
    const long = `${'a'.repeat(250)}@example.com`;
    expect(messagesFor(check(long), 'email')).toContain('Email address is too long');
  });

  it('uses the same email rules in the sign-up and sign-in forms', () => {
    for (const schema of [signUpSchema, signInSchema]) {
      expect(schema.safeParse({ email: 'bad', password: 'abcdefgh' }).success).toBe(false);
      expect(schema.safeParse({ email: VALID_EMAIL, password: 'abcdefgh' }).success).toBe(true);
    }
  });
});
