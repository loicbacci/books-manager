import { test, expect } from "@playwright/test";

const openSelect = async (
  scope: import("@playwright/test").Page | import("@playwright/test").Locator,
  triggerText: string
) => {
  const button = scope.getByRole("button", { name: triggerText });
  if ((await button.count()) > 0) {
    await button.first().click();
    return;
  }
  await scope.getByText(triggerText).first().click({ force: true });
};

test("authors and series create flows", async ({ page }) => {
  const authorName = `E2E Author ${Date.now()}`;
  const seriesName = `E2E Series ${Date.now()}`;

  await page.goto("/authors");
  await page.getByRole("button", { name: "Create" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByPlaceholder("Author name").fill(authorName);

  const nationalityInput = dialog.getByPlaceholder("Nationality");
  await nationalityInput.fill("French");
  await nationalityInput.press("Enter");

  await dialog.getByRole("button", { name: "Create" }).click();
  await expect(page.getByPlaceholder("Search")).toBeVisible();
  await page.getByRole("searchbox", { name: "Search" }).fill(authorName);
  await expect(page.getByText(authorName)).toBeVisible();

  await page.goto("/series");
  await page.getByPlaceholder("Series name").fill(seriesName);
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText(seriesName)).toBeVisible();
  await page.getByText(seriesName).first().click();
  await expect(page.getByRole("heading", { name: seriesName })).toBeVisible();
});
