import type { Page } from '@playwright/test';
import { expect, hasStoredSession, RIDER, signIn, test } from './support/fixtures';

const NEW_PASSWORD = 'Brand-new-pass-2';

/** Requests a reset through the real form, so this browser stores the PKCE verifier. */
async function requestReset(page: Page, email = RIDER.email) {
  await page.goto('/forgot-password');
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await expect(
    page.getByText(
      'If an account exists for that email, we’ve sent a link to reset your password.',
    ),
  ).toBeVisible();
}

const newPasswordField = (page: Page) => page.getByLabel('New password', { exact: true });

test.describe('Forgot-password page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forgot-password');
  });

  test('explains the same-browser rule and validates the email', async ({ page, fake }) => {
    await expect(
      page.getByText('Open the link in this same browser — it won’t work anywhere else.'),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Send reset link' }).click();
    await expect(page.getByLabel('Email')).toHaveAccessibleDescription(/Enter your email address/);
    await page.getByLabel('Email').fill('not-an-email');
    await page.getByRole('button', { name: 'Send reset link' }).click();
    await expect(page.getByLabel('Email')).toHaveAccessibleDescription(
      /Enter a valid email address/,
    );
    expect(fake.count('POST /recover')).toBe(0);
  });

  test('known and unknown addresses get the same neutral answer', async ({ page, fake }) => {
    fake.addUser(RIDER.email, RIDER.password);
    fake.latencyMs = 600;
    for (const email of [RIDER.email, 'nobody@example.test']) {
      await page.goto('/forgot-password');
      await page.getByLabel('Email').fill(email);
      await page.getByRole('button', { name: 'Send reset link' }).click();
      await expect(page.getByRole('button', { name: 'Sending link…' })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
      await expect(
        page.getByText(
          'If an account exists for that email, we’ve sent a link to reset your password.',
        ),
      ).toBeVisible();
    }
    expect(fake.count('POST /recover')).toBe(2);
  });

  test('rate limits and unexpected failures are not reported as "sent"', async ({ page, fake }) => {
    const cases: [number, string, string][] = [
      [429, 'over_email_send_rate_limit', 'Too many attempts. Please wait a while and try again.'],
      [400, 'unexpected_failure', 'We couldn’t send a reset link right now. Please try again.'],
      // supabase-js treats 5xx answers as connection problems.
      [500, 'unexpected_failure', 'We couldn’t reach Lobby. Check your connection and try again.'],
    ];
    for (const [status, code, message] of cases) {
      fake.failWith('POST /recover', status, code);
      await page.goto('/forgot-password');
      await page.getByLabel('Email').fill(RIDER.email);
      await page.getByRole('button', { name: 'Send reset link' }).click();
      await expect(page.getByText(message)).toBeVisible();
      await expect(page.getByText('we’ve sent a link to reset your password')).toHaveCount(0);
    }
  });
});

test.describe('Password recovery with a reset link (PKCE)', () => {
  test.beforeEach(async ({ fake }) => {
    fake.addUser(RIDER.email, RIDER.password);
  });

  test('full recovery: new password saved, all devices signed out, old password stops working', async ({
    page,
    fake,
  }) => {
    await requestReset(page);
    fake.latencyMs = 600;
    await page.goto(fake.emailLink('recovery', RIDER.email));
    await expect(page.getByText('Checking your reset link…')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Choose a new password' })).toBeVisible();
    expect(fake.count('POST /token?grant_type=pkce')).toBe(1);
    expect(new URL(page.url()).search).toBe('');
    fake.latencyMs = 150;

    // The same password is rejected by the server with a clear message.
    await newPasswordField(page).fill(RIDER.password);
    await page.getByRole('button', { name: 'Update password' }).click();
    await expect(
      page.getByText('Your new password must be different from your current one.'),
    ).toBeVisible();

    await newPasswordField(page).fill(NEW_PASSWORD);
    await page.getByRole('button', { name: 'Update password' }).click();
    await expect(page.getByRole('heading', { name: 'Password updated' })).toBeVisible();
    await expect(page.getByText('signed out on all devices', { exact: false })).toBeVisible();
    expect(fake.count('POST /logout?scope=global')).toBe(1);
    expect(fake.passwordOf(RIDER.email)).toBe(NEW_PASSWORD);
    expect(fake.sessionCount(RIDER.email)).toBe(0);
    expect(await hasStoredSession(page)).toBe(false);

    // Old password fails; new password works.
    await page.goto('/sign-in');
    await page.getByLabel('Email').fill(RIDER.email);
    await page.getByLabel('Password', { exact: true }).fill(RIDER.password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByText('Email or password is incorrect.')).toBeVisible();
    await signIn(page, RIDER.email, NEW_PASSWORD);
  });

  test('a rider signed in on another device is signed out by the reset', async ({
    page,
    fake,
    openOtherBrowser,
  }) => {
    const other = await openOtherBrowser();
    await signIn(other.page);
    expect(fake.sessionCount(RIDER.email)).toBe(1);
    await requestReset(page);
    await page.goto(fake.emailLink('recovery', RIDER.email));
    await newPasswordField(page).fill(NEW_PASSWORD);
    await page.getByRole('button', { name: 'Update password' }).click();
    await expect(page.getByText('signed out on all devices', { exact: false })).toBeVisible();
    expect(fake.sessionCount(RIDER.email)).toBe(0);
  });

  test('if all-device sign-out fails, the rider is told honestly', async ({ page, fake }) => {
    await requestReset(page);
    await page.goto(fake.emailLink('recovery', RIDER.email));
    fake.failWith('POST /logout', 500, 'unexpected_failure');
    await newPasswordField(page).fill(NEW_PASSWORD);
    await page.getByRole('button', { name: 'Update password' }).click();
    await expect(page.getByRole('heading', { name: 'Password updated' })).toBeVisible();
    await expect(
      page.getByText('We couldn’t confirm that your other devices were signed out', {
        exact: false,
      }),
    ).toBeVisible();
  });

  test('a reset link opened in a different browser shows no form', async ({
    page,
    fake,
    openOtherBrowser,
  }) => {
    await requestReset(page);
    const link = fake.emailLink('recovery', RIDER.email);
    const other = await openOtherBrowser();
    await other.page.goto(link);
    await expect(
      other.page.getByRole('heading', { name: 'Open the link in the same browser' }),
    ).toBeVisible();
    await expect(newPasswordField(other.page)).toHaveCount(0);
    expect(fake.count('POST /token?grant_type=pkce')).toBe(0);
    expect(await hasStoredSession(other.page)).toBe(false);
  });

  test('an expired reset code is reported and shows no form', async ({ page, fake }) => {
    await requestReset(page);
    await page.goto(fake.emailLink('recovery', RIDER.email, { expired: true }));
    await expect(page.getByRole('heading', { name: 'Link can’t be used' })).toBeVisible();
    await expect(
      page.getByText('This link is invalid, has expired or has already been used.'),
    ).toBeVisible();
    await expect(newPasswordField(page)).toHaveCount(0);
  });

  test('a network failure while checking the link asks for a new link', async ({ page, fake }) => {
    await requestReset(page);
    fake.override('POST /token', (route) => route.abort('internetdisconnected'));
    await page.goto(fake.emailLink('recovery', RIDER.email));
    await expect(
      page.getByRole('heading', { name: 'We couldn’t check your reset link' }),
    ).toBeVisible();
    await expect(page.getByText('We couldn’t reach Lobby while checking this link.')).toBeVisible();
    await expect(newPasswordField(page)).toHaveCount(0);
  });

  test('the form survives a reload in the same tab but not in a new tab', async ({
    page,
    fake,
    context,
  }) => {
    await requestReset(page);
    await page.goto(fake.emailLink('recovery', RIDER.email));
    await expect(newPasswordField(page)).toBeVisible();
    await page.reload();
    await expect(newPasswordField(page)).toBeVisible();

    // A new tab shares the sign-in but not this tab's recovery marker.
    const tab = await context.newPage();
    await tab.goto('/reset-password');
    await expect(tab.getByRole('heading', { name: 'Change your password' })).toBeVisible();
    await expect(newPasswordField(tab)).toHaveCount(0);
    await tab.close();
  });

  test('old-style #access_token reset links are never accepted', async ({ page, fake }) => {
    await page.goto(
      '/reset-password#access_token=FAKE_ACCESS_TOKEN&refresh_token=FAKE_REFRESH_TOKEN&type=recovery',
    );
    await expect(page.getByRole('heading', { name: 'Link can’t be used' })).toBeVisible();
    await expect(newPasswordField(page)).toHaveCount(0);
    expect(await hasStoredSession(page)).toBe(false);
    expect(fake.requests).toEqual([]);
    expect(page.url()).not.toContain('#');
  });
});

test.describe('Reset-password page access rules', () => {
  test('signed out with no link: instructions only, no form', async ({ page }) => {
    await page.goto('/reset-password');
    await expect(page.getByRole('heading', { name: 'Reset your password' })).toBeVisible();
    await expect(
      page.getByText('open the reset link we emailed you', { exact: false }),
    ).toBeVisible();
    await expect(newPasswordField(page)).toHaveCount(0);
  });

  test('signed in normally: no form; "Email me a reset link" sends one request', async ({
    page,
    fake,
  }) => {
    fake.addUser(RIDER.email, RIDER.password);
    await signIn(page);
    await page.goto('/reset-password');
    await expect(page.getByRole('heading', { name: 'Change your password' })).toBeVisible();
    await expect(newPasswordField(page)).toHaveCount(0);
    await page.getByRole('button', { name: 'Email me a reset link' }).click();
    await expect(
      page.getByText(
        'We’ve sent a reset link to your email address. Open it in this browser to choose a new password.',
      ),
    ).toBeVisible();
    expect(fake.count('POST /recover')).toBe(1);
    await expect(page).toHaveURL('/reset-password');
    await expect(page.getByRole('button', { name: 'Email me a reset link' })).toHaveCount(0);
  });
});
