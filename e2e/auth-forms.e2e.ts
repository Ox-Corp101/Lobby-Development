import { expect, RIDER, test } from './support/fixtures';

test.describe('Sign-up form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sign-up');
  });

  test('empty submission shows linked errors and focuses the first field', async ({ page }) => {
    await page.getByRole('button', { name: 'Create account' }).click();
    const email = page.getByLabel('Email');
    const password = page.getByLabel('Password', { exact: true });
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    await expect(email).toHaveAccessibleDescription(/Enter your email address/);
    await expect(password).toHaveAccessibleDescription(/Password must be at least 8 characters/);
    await expect(email).toBeFocused();
  });

  test('invalid email, short password and over-long password are rejected', async ({
    page,
    fake,
  }) => {
    const email = page.getByLabel('Email');
    const password = page.getByLabel('Password', { exact: true });
    await email.fill('not-an-email');
    await email.blur();
    await expect(email).toHaveAccessibleDescription(/Enter a valid email address/);
    await password.fill('short');
    await password.blur();
    await expect(password).toHaveAccessibleDescription(/at least 8 characters/);
    await password.fill('é'.repeat(37)); // 74 UTF-8 bytes
    await expect(password).toHaveAccessibleDescription(/Password is too long/);
    await password.fill('é'.repeat(36)); // exactly 72 bytes
    await expect(password).not.toHaveAttribute('aria-invalid', 'true');
    expect(fake.count('POST /signup')).toBe(0); // nothing is sent while invalid
  });

  test('the show/hide control reveals the password without losing it', async ({ page }) => {
    const password = page.getByLabel('Password', { exact: true });
    await password.fill('Secret-pass-1');
    await expect(password).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: 'Show password' }).click();
    await expect(password).toHaveAttribute('type', 'text');
    await expect(page.getByRole('button', { name: 'Hide password' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(password).toHaveValue('Secret-pass-1');
    await page.getByRole('button', { name: 'Hide password' }).click();
    await expect(password).toHaveAttribute('type', 'password');
  });

  test('a valid sign-up shows a loading state, sends one request and goes to "Check your email"', async ({
    page,
    fake,
  }) => {
    fake.latencyMs = 600;
    await page.getByLabel('Email').fill('new.rider@example.test');
    await page.getByLabel('Password', { exact: true }).fill('Original-pass-1');
    const submit = page.getByRole('button', { name: 'Create account' });
    await submit.click();
    const busy = page.getByRole('button', { name: 'Creating account…' });
    await expect(busy).toHaveAttribute('aria-disabled', 'true');
    await busy.click({ force: true }); // a second click while busy must be ignored
    await expect(page).toHaveURL('/check-email');
    await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();
    expect(fake.count('POST /signup')).toBe(1);
    expect(page.url()).not.toContain('Original-pass-1');
  });

  test('an already-registered email gets the same neutral result', async ({ page, fake }) => {
    fake.addUser(RIDER.email, RIDER.password);
    await page.getByLabel('Email').fill(RIDER.email);
    await page.getByLabel('Password', { exact: true }).fill('Another-pass-1');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL('/check-email');
  });

  test('server errors show clear messages instead of "check your email"', async ({
    page,
    fake,
  }) => {
    const cases: [number, string, string][] = [
      [400, 'email_address_invalid', 'This email address can’t be used.'],
      [422, 'signup_disabled', 'New accounts can’t be created right now.'],
      [400, 'unexpected_failure', 'We couldn’t create your account right now.'],
      [429, 'over_email_send_rate_limit', 'Too many attempts.'],
    ];
    for (const [status, code, message] of cases) {
      fake.failWith('POST /signup', status, code);
      await page.goto('/sign-up');
      await page.getByLabel('Email').fill('new.rider@example.test');
      await page.getByLabel('Password', { exact: true }).fill('Original-pass-1');
      await page.getByRole('button', { name: 'Create account' }).click();
      await expect(page.getByText(message)).toBeVisible();
      await expect(page).toHaveURL('/sign-up');
    }
  });
});

test.describe('Sign-in form', () => {
  test.beforeEach(async ({ page, fake }) => {
    fake.addUser(RIDER.email, RIDER.password);
    await page.goto('/sign-in');
  });

  test('empty submission asks for email and password', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByLabel('Email')).toHaveAccessibleDescription(/Enter your email address/);
    await expect(page.getByLabel('Password', { exact: true })).toHaveAccessibleDescription(
      /Enter your password/,
    );
  });

  test('a wrong password shows a generic error after a loading state', async ({ page, fake }) => {
    fake.latencyMs = 600;
    await page.getByLabel('Email').fill(RIDER.email);
    await page.getByLabel('Password', { exact: true }).fill('wrong-password');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Signing in…' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await expect(page.getByText('Email or password is incorrect.')).toBeVisible();
    await expect(page).toHaveURL('/sign-in');
  });

  test('an unconfirmed account can resend the confirmation email', async ({ page, fake }) => {
    fake.addUser('waiting@example.test', RIDER.password, { confirmed: false });
    await page.getByLabel('Email').fill('waiting@example.test');
    await page.getByLabel('Password', { exact: true }).fill(RIDER.password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByText('Please confirm your email first.')).toBeVisible();
    await page.getByRole('button', { name: 'Resend confirmation email' }).click();
    await expect(
      page.getByText('If that email address is waiting for confirmation, we’ve sent a new link.'),
    ).toBeVisible();
    expect(fake.count('POST /resend')).toBe(1);
  });

  test('rate limiting is reported clearly', async ({ page, fake }) => {
    fake.failWith('POST /token', 429, 'over_request_rate_limit');
    await page.getByLabel('Email').fill(RIDER.email);
    await page.getByLabel('Password', { exact: true }).fill(RIDER.password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(
      page.getByText('Too many attempts. Please wait a while and try again.'),
    ).toBeVisible();
  });

  test('the signed-out notice appears only when explicitly provided', async ({ page }) => {
    await expect(page.getByText('You’ve signed out.')).toHaveCount(0);
    await page.evaluate(() => {
      history.replaceState({ usr: { signedOut: true }, key: 'e2e', idx: 0 }, '', '/sign-in');
    });
    await page.reload();
    await expect(page.getByText('You’ve signed out.')).toBeVisible();
  });
});

test.describe('Check-email page', () => {
  test('offers a neutral resend form', async ({ page, fake }) => {
    await page.goto('/check-email');
    await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();
    await page.getByLabel('Email').fill('anyone@example.test');
    await page.getByRole('button', { name: 'Resend confirmation email' }).click();
    await expect(
      page.getByText('If that email address is waiting for confirmation, we’ve sent a new link.'),
    ).toBeVisible();
    expect(fake.count('POST /resend')).toBe(1);
  });
});
