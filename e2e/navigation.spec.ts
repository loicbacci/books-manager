import { test, expect } from "@playwright/test";

test("navigation links work", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByText("Dashboard").first()).toBeVisible();

  await page.getByRole("link", { name: "My Library" }).click();
  await expect(page).toHaveURL(/\/library/);
  await expect(page.getByRole("searchbox", { name: "Search" })).toBeVisible();

  await page.getByRole("link", { name: "Authors" }).click();
  await expect(page).toHaveURL(/\/authors/);

  await page.getByRole("link", { name: "Series" }).click();
  await expect(page).toHaveURL(/\/series/);

  await page.getByRole("link", { name: "Statistics" }).click();
  await expect(page).toHaveURL(/\/statistics/);

  await page.getByRole("link", { name: "Settings" }).click();
  await expect(page).toHaveURL(/\/settings/);
});
