import type { Page } from '@playwright/test';
import { expect, hasStoredSession, test } from './support/fixtures';

const NEW_RIDER = { email: 'new.rider@example.test', password: 'Original-pass-1' };

/** Signs up through the real form, so this browser stores the PKCE verifier. */
async function signUp(page: Page) {
  await page.goto('/sign-up');
  await page.getByLabel('Email').fill(NEW_RIDER.email);
  await page.getByLabel('Password', { exact: true }).fill(NEW_RIDER.password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL('/check-email');
}

/** The address bar must not contain codes, tokens or Supabase error details. */
async function expectCleanAddress(page: Page, path: string) {
  const href = await page.evaluate(() => location.href);
  expect(new URL(href).pathname).toBe(path);
  expect(href).not.toMatch(/[?&#](code|sb_flow_id|token_hash|access_token|refresh_token|error)/);
  expect(href).not.toContain('#');
}

test.describe('Email confirmation links (PKCE, default Supabase templates)', () => {
  test('same browser: the code is exchanged once, the rider is signed in and the address is cleaned', async ({
    page,
    fake,
  }) => {
    await signUp(page);
    await page.goto('/');
    const before = page.url();
    await page.goto(fake.emailLink('signup', NEW_RIDER.email));
    await expect(page.getByRole('heading', { name: 'Email confirmed' })).toBeVisible();
    await expect(page.getByText('You’re signed in and ready to go.')).toBeVisible();
    expect(fake.count('POST /token?grant_type=pkce')).toBe(1);
    await expectCleanAddress(page, '/auth/confirm');
    // The callback address must not survive as a history entry.
    const confirmUrl = page.url();
    await page.goBack();
    expect(page.url()).toBe(before);
    await page.goForward();
    expect(page.url()).toBe(confirmUrl);
    await expect(page.getByRole('heading', { name: 'Email confirmed' })).toBeVisible();
    await page.getByRole('link', { name: 'Continue' }).click();
    await expect(page).toHaveURL('/profile');
  });

  test('different browser: no exchange is attempted and the rider is told to sign in', async ({
    page,
    fake,
    openOtherBrowser,
  }) => {
    await signUp(page);
    const link = fake.emailLink('signup', NEW_RIDER.email);
    const other = await openOtherBrowser();
    await other.page.goto(link);
    await expect(other.page.getByRole('heading', { name: 'Sign in to continue' })).toBeVisible();
    await expect(
      other.page.getByText('your email address is now confirmed', { exact: false }),
    ).toBeVisible();
    expect(fake.count('POST /token?grant_type=pkce')).toBe(0);
    expect(await hasStoredSession(other.page)).toBe(false);
    await expectCleanAddress(other.page, '/auth/confirm');
  });

  test('expired or already-used links show a clear message (query and fragment styles)', async ({
    page,
  }) => {
    for (const suffix of [
      '?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired',
      '#error=access_denied&error_code=otp_expired&error_description=expired',
    ]) {
      await page.goto(`/auth/confirm${suffix}`);
      await expect(page.getByRole('heading', { name: 'Link can’t be used' })).toBeVisible();
      await expect(
        page.getByText('This link is invalid, has expired or has already been used.'),
      ).toBeVisible();
      await expectCleanAddress(page, '/auth/confirm');
    }
  });

  test('an expired code is rejected by the server and reported', async ({ page, fake }) => {
    await signUp(page);
    await page.goto(fake.emailLink('signup', NEW_RIDER.email, { expired: true }));
    await expect(page.getByRole('heading', { name: 'Link can’t be used' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Email confirmed' })).toHaveCount(0);
  });

  test('malformed links are rejected without contacting Supabase', async ({ page, fake }) => {
    for (const suffix of ['', '?code=bad%20code!', '?token_hash=abc&type=email', '?type=email']) {
      await page.goto(`/auth/confirm${suffix}`);
      await expect(page.getByRole('heading', { name: 'Link can’t be used' })).toBeVisible();
    }
    expect(fake.requests).toEqual([]);
  });

  test('old-style #access_token links are never accepted, stored or sent', async ({
    page,
    fake,
  }) => {
    await page.goto('/');
    await page.goto(
      '/auth/confirm#access_token=FAKE_ACCESS_TOKEN&refresh_token=FAKE_REFRESH_TOKEN&type=signup',
    );
    await expect(page.getByRole('heading', { name: 'Sign in to continue' })).toBeVisible();
    await expect(page.getByText('may already be confirmed', { exact: false })).toBeVisible();
    expect(await hasStoredSession(page)).toBe(false);
    const storage = await page.evaluate(
      () => JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }),
    );
    expect(storage).not.toContain('FAKE_');
    expect(fake.requests).toEqual([]);
    await expectCleanAddress(page, '/auth/confirm');
  });

  test('a network failure during the exchange gives an honest next step', async ({
    page,
    fake,
  }) => {
    await signUp(page);
    fake.override('POST /token', (route) => route.abort('internetdisconnected'));
    await page.goto(fake.emailLink('signup', NEW_RIDER.email));
    await expect(
      page.getByRole('heading', { name: 'We couldn’t finish signing you in' }),
    ).toBeVisible();
    await expect(page.getByText('most likely already confirmed', { exact: false })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Try again' })).toHaveCount(0);
    await expectCleanAddress(page, '/auth/confirm');
  });
});
