import { test, expect } from "@playwright/test";

test("unauthenticated users are redirected to login", async ({ browser }) => {
  const context = await browser.newContext({ storageState: undefined });
  const page = await context.newPage();
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
  await context.close();
});
