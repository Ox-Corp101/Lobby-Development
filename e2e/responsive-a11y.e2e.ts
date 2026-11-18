import type { Page } from '@playwright/test';
import { expect, RIDER, test } from './support/fixtures';

const PHONE = { width: 375, height: 740 };
const DESKTOP = { width: 1280, height: 800 };

const menuToggle = (page: Page) => page.getByRole('button', { name: /^(Open|Close) menu$/ });

/** Presses Tab until the given element has focus (fails after `max` presses). */
async function tabTo(page: Page, isTarget: () => Promise<boolean>, max = 15) {
  for (let i = 0; i < max; i += 1) {
    await page.keyboard.press('Tab');
    if (await isTarget()) return;
  }
  throw new Error('Element was not reached with the Tab key');
}

test.describe('Desktop layout', () => {
  test.use({ viewport: DESKTOP });

  test('shows the header navigation and hides the menu button', async ({ page }) => {
    await page.goto('/');
    const header = page.getByRole('banner');
    await expect(header.getByRole('link', { name: 'Sign in' })).toBeVisible();
    await expect(header.getByRole('link', { name: 'Create account' })).toBeVisible();
    await expect(menuToggle(page)).toBeHidden();
  });

  test('the skip link appears on first Tab and moves focus to the main content', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible(); // page has rendered
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main')).toBeFocused();
  });

  test('keyboard focus is clearly outlined', async ({ page }) => {
    await page.goto('/sign-in');
    await tabTo(page, () =>
      page
        .getByRole('banner')
        .getByRole('link', { name: 'Sign in' })
        .evaluate((el) => el === document.activeElement),
    );
    const outline = await page.evaluate(() => {
      const style = getComputedStyle(document.activeElement as Element);
      return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
    });
    expect(outline.style).not.toBe('none');
    expect(outline.width).toBeGreaterThanOrEqual(2);
  });

  test('a rider can sign in using only the keyboard', async ({ page, fake }) => {
    fake.addUser(RIDER.email, RIDER.password);
    await page.goto('/sign-in');
    const email = page.getByLabel('Email');
    await tabTo(page, () => email.evaluate((el) => el === document.activeElement));
    await page.keyboard.type(RIDER.email);
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Password', { exact: true })).toBeFocused();
    await page.keyboard.type(RIDER.password);
    await page.keyboard.press('Enter'); // Enter submits the form
    await expect(page).toHaveURL('/profile');
  });
});

test.describe('Phone layout', () => {
  test.use({ viewport: PHONE });

  test('the header links are replaced by a menu button', async ({ page }) => {
    await page.goto('/');
    await expect(menuToggle(page)).toBeVisible();
    await expect(page.getByRole('banner').getByRole('link', { name: 'Sign in' })).toBeHidden();
  });

  test('the menu works with the keyboard: open, focus, Esc, focus returns', async ({ page }) => {
    await page.goto('/');
    const toggle = menuToggle(page);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(toggle).toHaveAccessibleName('Close menu');
    const menu = page.locator(`#${await toggle.getAttribute('aria-controls')}`);
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Sign in' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(toggle).toBeFocused();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('choosing a menu link navigates and closes the menu', async ({ page }) => {
    await page.goto('/');
    await menuToggle(page).click();
    await page.getByRole('banner').getByRole('link', { name: 'Create account' }).click();
    await expect(page).toHaveURL('/sign-up');
    await expect(menuToggle(page)).toHaveAttribute('aria-expanded', 'false');
  });

  test('tapping outside closes the menu', async ({ page }) => {
    await page.goto('/');
    await menuToggle(page).click();
    await expect(menuToggle(page)).toHaveAttribute('aria-expanded', 'true');
    await page.getByRole('contentinfo').click(); // the footer, outside the open menu
    await expect(menuToggle(page)).toHaveAttribute('aria-expanded', 'false');
  });

  test('signed in, the menu offers Profile and Sign out', async ({ page, fake }) => {
    fake.addUser(RIDER.email, RIDER.password);
    await page.goto('/sign-in');
    await page.getByLabel('Email').fill(RIDER.email);
    await page.getByLabel('Password', { exact: true }).fill(RIDER.password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL('/profile');
    await menuToggle(page).click();
    const banner = page.getByRole('banner');
    await expect(banner.getByRole('link', { name: 'Profile' })).toBeVisible();
    await banner.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL('/sign-in');
    await expect(page.getByText('You’ve signed out.')).toBeVisible();
  });
});

test.describe('No sideways scrolling', () => {
  for (const width of [320, 375, 768, 1280]) {
    test(`pages fit a ${width}px-wide screen`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      for (const path of [
        '/',
        '/sign-in',
        '/sign-up',
        '/check-email',
        '/forgot-password',
        '/reset-password',
        '/auth/confirm',
        '/no-such-page',
      ]) {
        await page.goto(path);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, `horizontal overflow on ${path}`).toBeLessThanOrEqual(0);
      }
    });
  }
});
