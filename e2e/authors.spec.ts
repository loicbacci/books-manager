import { test, expect } from "@playwright/test";

test("authors list shows seeded authors", async ({ page }) => {
  await page.goto("/authors");
  await expect(page.getByRole("heading", { name: "Authors" })).toBeVisible();
  await expect(page.getByText("Nicolas Mathieu")).toBeVisible();
  await expect(page.getByText("Holly Black")).toBeVisible();
});
