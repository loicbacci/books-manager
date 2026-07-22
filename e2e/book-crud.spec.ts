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
  await page.getByRole("button", { name: "Add a book" }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByPlaceholder("Enter book title").fill(title);

  const [response] = await Promise.all([
    page.waitForResponse(
      (resp) =>
        resp.url().includes("/api/books") &&
        resp.request().method() === "POST" &&
        !resp.url().includes("/bulk")
    ),
    page.getByRole("button", { name: "Add" }).last().click(),
  ]);
  expect(response.ok()).toBeTruthy();
  await expect(dialog).toBeHidden({ timeout: 15_000 });
};

test("book add, edit, and delete with dates and toasts", async ({ page }) => {
  const title = `E2E CRUD Book ${Date.now()}`;
  await page.goto("/library");

  await addBook(page, title);
  await page.goto("/library");

  const search = page.getByRole("searchbox", { name: "Search" });
  await search.fill(title);
  await page.waitForURL(/search=/);
  const bookLink = page.getByRole("link", { name: new RegExp(title) }).first();
  await expect(bookLink).toBeVisible();
  const href = await bookLink.getAttribute("href");
  expect(href).toBeTruthy();
  await page.goto(href!);
  await expect(page).toHaveURL(/\/books\//);
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();

  const slugFromUrl = page.url().split("/").pop()!;
  const bookRes = await page.request.get(`/api/books/${slugFromUrl}`);
  expect(bookRes.ok()).toBeTruthy();
  const bookJson = (await bookRes.json()) as { id: string };
  const bookId = bookJson.id;

  await page.getByRole("button", { name: "Edit" }).click();
  const titleField = page.getByLabel("Title", { exact: true }).or(
    page.getByText("Title", { exact: true }).locator("..").locator("input")
  );
  await titleField.first().fill(`${title} Updated`);

  const datesToggle = page.getByRole("button", { name: /Dates/i });
  if (await datesToggle.isVisible()) {
    await datesToggle.click();
  }

  const editDates = page.locator('input[type="date"]');
  if ((await editDates.count()) >= 2) {
    await editDates.nth(0).fill("2025-01-01");
    await editDates.nth(1).fill("2025-01-10");
  }

  const ratingTrigger = page.getByRole("button", { name: /Not rated|★/i });
  if (await ratingTrigger.count()) {
    await openSelect(page, "Not rated");
    const fiveStars = page.getByText("⭐️⭐️⭐️⭐️⭐️");
    if (await fiveStars.count()) {
      await fiveStars.click();
    }
  }

  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Changes saved")).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 1, name: `${title} Updated` })
  ).toBeVisible();

  // Delete by stable id (slug regenerates when title changes)
  const deleteResponse = await page.request.delete(`/api/books/${bookId}`);
  expect(deleteResponse.ok()).toBeTruthy();

  await page.goto("/library");
  await search.fill(`${title} Updated`);
  await page.waitForTimeout(500);
  await expect(page.getByRole("link", { name: new RegExp(title) })).toHaveCount(
    0
  );
});
