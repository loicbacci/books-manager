import { test, expect } from "@playwright/test";

const openNavIfMobile = async (page: import("@playwright/test").Page) => {
  const menuButton = page.getByRole("button", { name: "Open menu" });
  if (await menuButton.isVisible()) {
    await menuButton.click();
  }
};

test("navigation links route to pages", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  await openNavIfMobile(page);
  await page.getByRole("link", { name: "My Library" }).click();
  await expect(page.getByRole("heading", { name: "My Library" })).toBeVisible();

  await openNavIfMobile(page);
  await page.getByRole("link", { name: "Authors" }).click();
  await expect(page.getByRole("heading", { name: "Authors" })).toBeVisible();

  await openNavIfMobile(page);
  await page.getByRole("link", { name: "Series" }).click();
  await expect(page.getByRole("heading", { name: "Series" })).toBeVisible();

  await openNavIfMobile(page);
  await page.getByRole("link", { name: "Statistics" }).click();
  await expect(page.getByRole("heading", { name: "Statistics" })).toBeVisible();

  await openNavIfMobile(page);
  await page.getByRole("link", { name: "Settings" }).click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
});
