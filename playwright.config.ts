import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const databaseUrl =
  process.env.PLAYWRIGHT_DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5433/booksmanager_test";
const inviteCode = process.env.PLAYWRIGHT_INVITE_CODE || "e2e-invite-code";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  timeout: 30 * 1000,
  reporter: process.env.CI ? "dot" : "list",
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120 * 1000,
    env: {
      PORT: "3000",
      DATABASE_URL: databaseUrl,
      NEXTAUTH_URL: baseURL,
      NEXTAUTH_SECRET:
        process.env.NEXTAUTH_SECRET || "playwright-test-secret",
      REGISTRATION_INVITE_CODE: inviteCode,
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
