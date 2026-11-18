import { expect, test } from './support/fixtures';
import { FAKE_SUPABASE_URL } from './support/fakeSupabase';

// Checks the test set-up itself, so a misconfiguration can't silently reach a real service.
test.describe('Test isolation', () => {
  test('the app is configured with the fake Supabase host', async ({ page, fake }) => {
    fake.addUser('rider@example.test', 'Correct-horse-1');
    const hosts = new Set<string>();
    page.on('request', (request) => hosts.add(new URL(request.url()).origin));
    await page.goto('/sign-in');
    await page.getByLabel('Email').fill('rider@example.test');
    await page.getByLabel('Password', { exact: true }).fill('Correct-horse-1');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL('/profile');
    expect([...hosts].sort()).toEqual([FAKE_SUPABASE_URL, 'http://localhost:5174'].sort());
  });

  test('requests to any other host are blocked and recorded', async ({ page, networkGuard }) => {
    await page.goto('/');
    const reached = await page.evaluate(() =>
      fetch('https://example.com/').then(
        () => true,
        () => false,
      ),
    );
    expect(reached).toBe(false);
    expect(networkGuard).toEqual(['https://example.com']);
    networkGuard.length = 0; // expected here; any other test with a blocked request fails
  });
});
