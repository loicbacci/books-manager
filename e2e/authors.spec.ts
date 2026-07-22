import { test, expect } from "@playwright/test";

test("authors list renders seeded authors", async ({ page }) => {
  await page.goto("/authors");
  await expect(page.getByRole("button", { name: "Create" })).toBeVisible();
  // Seed includes Nicolas Mathieu; search if pagination hides them
  const search = page.getByRole("searchbox", { name: "Search" });
  await search.fill("Nicolas");
  await page.waitForTimeout(500);
  await expect(page.getByText("Nicolas Mathieu")).toBeVisible();
});
