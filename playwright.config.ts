import { defineConfig, devices } from "@playwright/test";

// Playwright config — browser-level E2E that catches silent React 19 hydration
// regressions (see AUDIT_LOG §17 + §20). These tests assert actual user-visible
// behavior: click a button, state changes; type a message, chat streams. Unlike
// unit tests (vitest) or curl-based smoke checks, these detect when SSR HTML
// looks fine but client-side interactivity is dead — the exact signature of
// the bug that wasted ~3 hours of debugging on 2026-04-17.
//
// Target: BASE_URL env var; defaults to production prempawee.com. Override for
// local dev: `BASE_URL=http://localhost:3000 npm run test:e2e`. In CI, Vercel
// preview deploys set BASE_URL automatically via the deploy-hook step.

const BASE_URL = process.env.BASE_URL || "https://prempawee.com";
const IS_CI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: IS_CI,
  retries: IS_CI ? 2 : 0,
  workers: IS_CI ? 1 : undefined,
  reporter: IS_CI ? [["github"], ["html", { open: "never" }]] : "list",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: IS_CI ? "retain-on-failure" : "off",
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
