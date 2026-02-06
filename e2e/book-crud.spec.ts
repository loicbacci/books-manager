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

const addBook = async (page: import("@playwright/test").Page, title: string) => {
  await page.getByRole("button", { name: "Add a book" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByPlaceholder("Enter book title").fill(title);

  const [response] = await Promise.all([
    page.waitForResponse(
      (resp) =>
        resp.url().includes("/api/books") &&
        resp.request().method() === "POST"
    ),
    page.getByRole("button", { name: "Add" }).last().click(),
  ]);
  expect(response.ok()).toBeTruthy();
};

test("book add, edit, and delete with dates and toasts", async ({ page }) => {
  const title = `E2E CRUD Book ${Date.now()}`;
  await page.goto("/library");

  await addBook(page, title);
  await page.goto("/library");

  const search = page.getByRole("searchbox", { name: "Search" });
  await search.fill(title);
  await page.getByText(title).first().click();

  await expect(page.getByRole("heading", { name: title })).toBeVisible();

  await page.getByRole("button", { name: "Edit" }).click();
  const titleField = page.getByText("Title").locator("..").locator("input");
  await titleField.fill(`${title} Updated`);

  const editDates = page.locator('input[type="date"]');
  await editDates.nth(0).fill("2025-01-01");
  await editDates.nth(1).fill("2025-01-10");

  await openSelect(page, "Not rated");
  await page.getByText("⭐️⭐️⭐️⭐️⭐️").click();

  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Changes saved")).toBeVisible();
  await expect(page.getByText("Not finished yet")).toHaveCount(0);

  await page.getByRole("button", { name: "Delete" }).click();
  const deleteDialog = page.getByRole("dialog");
  await expect(deleteDialog).toBeVisible();
  const [deleteResponse] = await Promise.all([
    page.waitForResponse(
      (resp) =>
        resp.url().includes("/api/books/") &&
        resp.request().method() === "DELETE"
    ),
    deleteDialog.getByRole("button", { name: "Delete" }).click(),
  ]);
  expect(deleteResponse.ok()).toBeTruthy();

  await expect(page).toHaveURL(/\/library/);
  await search.fill(`${title} Updated`);
  await expect(page.getByText(`${title} Updated`)).toHaveCount(0);
});
