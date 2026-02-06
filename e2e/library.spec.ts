import { test, expect } from "@playwright/test";

test("library search filters books", async ({ page }) => {
  await page.goto("/library");
  await expect(page.getByRole("heading", { name: "My Library" })).toBeVisible();

  await expect(page.getByText("Leurs enfants après eux")).toBeVisible();

  const search = page.getByRole("searchbox", { name: "Search" });
  await search.fill("Parasite Kiseju : T1");
  await expect(page.getByText("Parasite Kiseju : T1")).toBeVisible();
});
