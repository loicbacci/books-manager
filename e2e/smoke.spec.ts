import { test, expect } from "@playwright/test";

test("dashboard loads with navigation", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByRole("link", { name: "My Library" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Authors" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Series" })).toBeVisible();
});
