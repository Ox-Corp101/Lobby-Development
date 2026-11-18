import { defineConfig, devices } from '@playwright/test';
import { FAKE_SUPABASE_KEY, FAKE_SUPABASE_URL } from './e2e/support/fakeSupabase';

/**
 * Browser tests for Lobby (run with `npm run test:e2e`).
 *
 * Safety: the app under test is started with FAKE Supabase settings. Values
 * passed this way take priority over any `.env.local`, so a developer's real
 * Supabase project is never used. On top of that, every test blocks all
 * network requests except the local app and the in-browser fake Supabase
 * (see e2e/support/fixtures.ts). No real emails are sent and no real accounts
 * are touched.
 */
const PORT = 5174; // separate from `npm run dev` (5173), so both can run at once

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts', // distinct from Vitest's *.test.ts, so the two never mix
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      VITE_SUPABASE_URL: FAKE_SUPABASE_URL,
      VITE_SUPABASE_PUBLISHABLE_KEY: FAKE_SUPABASE_KEY,
      VITE_CONFIG_NATIVE_IGNORE_WARNING: 'true',
    },
  },
});
