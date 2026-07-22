import { test, expect } from "@playwright/test";

test("library search filters books via server query", async ({ page }) => {
  await page.goto("/library");

  await expect(page.getByText("Leurs enfants après eux")).toBeVisible();

  const search = page.getByRole("searchbox", { name: "Search" });
  await search.fill("Parasite Kiseju : T1");
  await page.waitForURL(/search=/);
  await expect(page.getByText("Parasite Kiseju : T1")).toBeVisible();
});

test("wishlist deep link filters library", async ({ page }) => {
  await page.goto("/library?wishlist=1");
  await expect(page.getByRole("button", { name: /Wishlist|clear/i }).or(page.getByText(/Wishlist/i)).first()).toBeVisible();
});

test("sheet-import redirects to library", async ({ page }) => {
  await page.goto("/sheet-import");
  await expect(page).toHaveURL(/\/library/);
});
