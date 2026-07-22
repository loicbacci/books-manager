import { test, expect } from "@playwright/test";

test("authors and series create flows", async ({ page }) => {
  const authorName = `E2E Author ${Date.now()}`;
  const seriesName = `E2E Series ${Date.now()}`;

  await page.goto("/authors");
  await page.getByRole("button", { name: "Create" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByPlaceholder("Author name").fill(authorName);
  // Create without opening nationality popover (avoids overlay intercepting Create)
  await dialog.getByRole("button", { name: "Create" }).click({ force: true });
  await page.getByRole("searchbox", { name: "Search" }).fill(authorName);
  await page.waitForTimeout(400);
  await expect(page.getByText(authorName)).toBeVisible();

  await page.goto("/series");
  await page.getByRole("button", { name: /Create|Add/i }).first().click();
  const seriesDialog = page.getByRole("dialog");
  await expect(seriesDialog).toBeVisible();
  await seriesDialog.getByPlaceholder("Series name").fill(seriesName);
  await seriesDialog.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText(seriesName)).toBeVisible();
  const seriesLink = page
    .getByRole("link", { name: new RegExp(seriesName) })
    .first();
  if ((await seriesLink.count()) > 0) {
    const href = await seriesLink.getAttribute("href");
    await page.goto(href!);
  } else {
    await page.getByText(seriesName).first().click();
  }
  await expect(page.getByRole("heading", { name: seriesName })).toBeVisible();
});
