import { test, expect } from "@playwright/test";

test("dashboard smoke", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByText("Dashboard").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "My Library" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Authors" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Series" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Statistics" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();
});
