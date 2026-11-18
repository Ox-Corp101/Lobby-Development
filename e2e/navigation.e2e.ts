import { expect, hasStoredSession, RIDER, signIn, test } from './support/fixtures';

test.describe('Application navigation', () => {
  test('home page loads with its heading and primary actions', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Lobby — Ride together');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ride together.');
    const main = page.getByRole('main');
    await expect(main.getByRole('link', { name: 'Create account' })).toBeVisible();
    await expect(main.getByRole('link', { name: 'Sign in' })).toBeVisible();
  });

  test('header links open the sign-in and sign-up pages', async ({ page }) => {
    await page.goto('/');
    const header = page.getByRole('banner');
    await header.getByRole('link', { name: 'Sign in' }).click();
    await expect(page).toHaveURL('/sign-in');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    await page.getByRole('banner').getByRole('link', { name: 'Create account' }).click();
    await expect(page).toHaveURL('/sign-up');
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
  });

  test('unknown pages show the not-found page with a way home', async ({ page }) => {
    await page.goto('/no-such-page');
    await expect(page).toHaveTitle('Page not found · Lobby');
    await page.getByRole('link', { name: 'Back to home' }).click();
    await expect(page).toHaveURL('/');
  });

  test('signed-out visitors to a protected page are sent to sign-in', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL('/sign-in');
    // This redirect is not a sign-out, so the signed-out notice must not appear.
    await expect(page.getByText('You’ve signed out.')).toHaveCount(0);
  });

  test('a signed-in rider can open the protected profile page', async ({ page, fake }) => {
    fake.addUser(RIDER.email, RIDER.password);
    await signIn(page);
    await expect(page.getByRole('heading', { name: 'My profile' })).toBeVisible();
    const header = page.getByRole('banner');
    await expect(header.getByRole('link', { name: 'Profile' })).toBeVisible();
    await expect(header.getByRole('button', { name: 'Sign out' })).toBeVisible();
  });

  test('after sign-in, riders return to the page they originally asked for', async ({
    page,
    fake,
  }) => {
    fake.addUser(RIDER.email, RIDER.password);
    await page.goto('/profile?tab=bikes');
    await expect(page).toHaveURL('/sign-in');
    await page.getByLabel('Email').fill(RIDER.email);
    await page.getByLabel('Password', { exact: true }).fill(RIDER.password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL('/profile?tab=bikes');
  });

  test('unsafe return destinations are ignored', async ({ page, fake }) => {
    fake.addUser(RIDER.email, RIDER.password);
    for (const unsafe of ['https://evil.example/steal', '//evil.example', 'javascript:alert(1)']) {
      await page.goto('/sign-in');
      // Simulate a crafted "return to" value in the navigation state.
      await page.evaluate((from) => {
        history.replaceState({ usr: { from }, key: 'e2e', idx: 0 }, '', '/sign-in');
      }, unsafe);
      await page.reload();
      await page.getByLabel('Email').fill(RIDER.email);
      await page.getByLabel('Password', { exact: true }).fill(RIDER.password);
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      await expect(page).toHaveURL('/profile');
      await page.getByRole('banner').getByRole('button', { name: 'Sign out' }).click();
      await expect(page).toHaveURL('/sign-in');
    }
  });

  test('signed-in riders are sent away from sign-in and sign-up', async ({ page, fake }) => {
    fake.addUser(RIDER.email, RIDER.password);
    await signIn(page);
    await page.goto('/sign-in');
    await expect(page).toHaveURL('/profile');
    await page.goto('/sign-up');
    await expect(page).toHaveURL('/profile');
  });

  test('sign-out clears this device only and shows the signed-out notice', async ({
    page,
    fake,
  }) => {
    fake.addUser(RIDER.email, RIDER.password);
    await signIn(page);
    expect(await hasStoredSession(page)).toBe(true);
    await page.getByRole('banner').getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL('/sign-in');
    await expect(page.getByText('You’ve signed out.')).toBeVisible();
    expect(await hasStoredSession(page)).toBe(false);
    expect(fake.count('POST /logout?scope=local')).toBe(1);
    expect(fake.count('POST /logout?scope=global')).toBe(0);
  });

  test('the session survives a page reload', async ({ page, fake }) => {
    fake.addUser(RIDER.email, RIDER.password);
    await signIn(page);
    await page.reload();
    await expect(page).toHaveURL('/profile');
    await expect(page.getByRole('banner').getByRole('button', { name: 'Sign out' })).toBeVisible();
  });
});
