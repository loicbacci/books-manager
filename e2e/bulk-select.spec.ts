import { test, expect } from "@playwright/test";

test.describe("bulk multi-select", () => {
  test("select books and bulk delete", async ({ page }) => {
    const stamp = Date.now();
    const titleA = `E2E BulkA ${stamp}`;
    const titleB = `E2E BulkB ${stamp}`;

    await page.goto("/library");

    for (const title of [titleA, titleB]) {
      await page.getByRole("button", { name: "Add a book" }).first().click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await dialog.getByPlaceholder("Enter book title").fill(title);
      await Promise.all([
        page.waitForResponse(
          (resp) =>
            resp.url().includes("/api/books") &&
            resp.request().method() === "POST" &&
            !resp.url().includes("/bulk")
        ),
        dialog.getByRole("button", { name: "Add" }).last().click(),
      ]);
      await expect(dialog).toBeHidden({ timeout: 15_000 });
    }

    await page.goto("/library");
    const search = page.getByRole("searchbox", { name: "Search" });
    await search.fill(String(stamp));
    await page.waitForTimeout(700);

    await page.getByRole("button", { name: "Select" }).click();
    await page.getByRole("button", { name: new RegExp(titleA) }).click();
    await page.getByRole("button", { name: new RegExp(titleB) }).click();
    await expect(page.getByText(/2 selected/)).toBeVisible();

    // Wishlist while selection is active (clears selected ids but keeps selection mode)
    await page.getByRole("button", { name: "Add to wishlist" }).click();
    await page.waitForResponse(
      (r) =>
        r.url().includes("/api/books/bulk") && r.request().method() === "PATCH"
    );

    // Re-select cards (selection mode should still be on)
    await page.getByRole("button", { name: new RegExp(titleA) }).click();
    await page.getByRole("button", { name: new RegExp(titleB) }).click();
    await expect(page.getByText(/2 selected/)).toBeVisible();

    await page.getByRole("button", { name: "Delete", exact: true }).click();
    const confirm = page.getByRole("alertdialog");
    await expect(confirm).toBeVisible();
    await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes("/api/books/bulk") &&
          resp.request().method() === "DELETE"
      ),
      confirm.getByRole("button", { name: "Delete" }).click(),
    ]);

    await search.fill(titleA);
    await page.waitForTimeout(500);
    await expect(
      page.getByRole("link", { name: new RegExp(titleA) })
    ).toHaveCount(0);
  });
});
