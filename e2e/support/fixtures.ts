import {
  test as base,
  expect,
  type Browser,
  type BrowserContext,
  type Page,
} from '@playwright/test';
import { FakeSupabase } from './fakeSupabase';

/**
 * Blocks every request that isn't for the local app or the fake Supabase host,
 * and records it. Any recorded request fails the test, so a misconfiguration
 * can never reach a real Supabase project or any other real service.
 */
async function guardNetwork(context: BrowserContext, blocked: string[]): Promise<void> {
  await context.route('**/*', (route) => {
    const { hostname, origin } = new URL(route.request().url());
    if (hostname === 'localhost' || hostname === '127.0.0.1') return route.continue();
    blocked.push(origin);
    return route.abort('blockedbyclient');
  });
}

type Fixtures = {
  /** Fresh fake Supabase for this test (shared by every browser in the test). */
  fake: FakeSupabase;
  /** Opens a separate browser (its own storage), like a different browser app. */
  openOtherBrowser: () => Promise<{ context: BrowserContext; page: Page }>;
};

export const test = base.extend<Fixtures & { networkGuard: string[] }>({
  networkGuard: [
    async ({ context }, provide) => {
      const blocked: string[] = [];
      await guardNetwork(context, blocked);
      await provide(blocked);
      expect(blocked, 'Requests to hosts other than the app and the fake Supabase').toEqual([]);
    },
    { auto: true },
  ],

  fake: [
    async ({ context, networkGuard }, provide) => {
      void networkGuard; // ensure the guard is installed first
      const fake = new FakeSupabase();
      await fake.install(context); // registered after the guard, so it answers first
      await provide(fake);
    },
    { auto: true },
  ],

  openOtherBrowser: async ({ browser, fake }, provide) => {
    const opened: BrowserContext[] = [];
    const blocked: string[] = [];
    await provide(async () => {
      const context = await (browser as Browser).newContext();
      opened.push(context);
      await guardNetwork(context, blocked);
      await fake.install(context);
      return { context, page: await context.newPage() };
    });
    for (const context of opened) await context.close();
    expect(blocked, 'Requests to hosts other than the app and the fake Supabase').toEqual([]);
  },
});

export { expect };

/** Test rider used across suites (fake address on a reserved test domain). */
export const RIDER = { email: 'rider@example.test', password: 'Correct-horse-1' };

/** Signs in through the real sign-in form and waits for the profile page. */
export async function signIn(page: Page, email = RIDER.email, password = RIDER.password) {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/profile/);
}

/** True when Supabase's stored session exists in this page's localStorage. */
export async function hasStoredSession(page: Page): Promise<boolean> {
  return page.evaluate(() => Object.keys(localStorage).some((k) => k.endsWith('-auth-token')));
}
