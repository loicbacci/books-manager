import { test as setup, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";

const email = process.env.E2E_USER_EMAIL ?? "demo@example.com";
const password = process.env.E2E_USER_PASSWORD ?? "password123";

setup("authenticate", async ({ page }) => {
  mkdirSync("test-results", { recursive: true });

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await page.context().storageState({ path: "test-results/auth.json" });
});
