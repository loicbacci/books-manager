import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PLAYWRIGHT_PORT ?? "3001";
const BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;
const DB_URL =
  process.env.PLAYWRIGHT_DB_URL ??
  "postgresql://postgres:postgres@localhost:5433/booksmanager_test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { outputFolder: "test-results/playwright-report", open: "never" }],
  ],
  outputDir: "test-results/playwright",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      NODE_ENV: "test",
      DATABASE_URL: DB_URL,
      NEXTAUTH_URL: BASE_URL,
      NEXTAUTH_SECRET: "playwright-test-secret",
      REGISTRATION_INVITE_CODE: "playwright-invite",
      E2E_USER_EMAIL: process.env.E2E_USER_EMAIL ?? "demo@example.com",
      E2E_USER_PASSWORD: process.env.E2E_USER_PASSWORD ?? "password123",
    },
  },
  globalSetup: "./scripts/e2e/global-setup.ts",
  globalTeardown: "./scripts/e2e/global-teardown.ts",
  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: "chromium",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "test-results/auth.json",
      },
    },
    {
      name: "iphone",
      dependencies: ["setup"],
      use: {
        ...devices["iPhone 13"],
        storageState: "test-results/auth.json",
      },
    },
    {
      name: "ipad",
      dependencies: ["setup"],
      use: {
        ...devices["iPad Pro 11"],
        storageState: "test-results/auth.json",
      },
    },
  ],
});
