import { test, expect } from "@playwright/test";

const getStatValue = async (
  page: import("@playwright/test").Page,
  label: string
) => {
  const card = page
    .getByText(label, { exact: true })
    .locator("..")
    .locator("..");
  const text = await card.innerText();
  const match = text.match(/\d[\d,]*/);
  return match ? Number(match[0].replace(/,/g, "")) : 0;
};

const addReadBook = async (
  page: import("@playwright/test").Page,
  title: string
) => {
  await page.goto("/library");
  await page.getByRole("button", { name: "Add a book" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByPlaceholder("Enter book title").fill(title);
  await dialog.getByRole("spinbutton", { name: "Total pages" }).fill("200");
  await dialog.getByRole("spinbutton", { name: "Current page" }).fill("0");

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

test("statistics reflect newly added read book", async ({ page }) => {
  const initialStatsResponse = await page.request.get("/api/stats/detailed");
  const initialStats = (await initialStatsResponse.json()) as {
    summary: { totalBooksRead: number };
  };
  const initialReadCount = initialStats.summary.totalBooksRead;

  const title = `E2E Stats Read ${Date.now()}`;
  await addReadBook(page, title);

  const booksResponse = await page.request.get(
    `/api/books?search=${encodeURIComponent(title)}&page=1&pageSize=1`
  );
  const booksData = (await booksResponse.json()) as {
    items: Array<{ id: string }>;
  };
  const bookId = booksData.items[0]?.id;
  expect(bookId).toBeTruthy();

  const markReadResponse = await page.request.patch(`/api/books/${bookId}`, {
    data: {
      status: "READ",
      endDate: new Date().toISOString(),
    },
  });
  expect(markReadResponse.ok()).toBeTruthy();

  const updatedStatsResponse = await page.request.get("/api/stats/detailed");
  const updatedStats = (await updatedStatsResponse.json()) as {
    summary: { totalBooksRead: number };
  };
  const updatedReadCount = updatedStats.summary.totalBooksRead;

  expect(updatedReadCount).toBe(initialReadCount + 1);

  await page.goto("/statistics");
  await expect(page.getByRole("heading", { name: "Statistics" })).toBeVisible();
  const uiReadCount = await getStatValue(page, "Books read");
  expect(uiReadCount).toBe(updatedReadCount);
});
