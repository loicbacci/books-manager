import { test, expect } from "@playwright/test";

test("landing page shows key sections and auth links", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Books Manager" })
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Features" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Log in" })).toHaveCount(2);
  await expect(page.getByRole("link", { name: "Register" })).toHaveCount(2);
});
