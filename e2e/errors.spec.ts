import { test, expect } from "@playwright/test";

test("error toasts appear on failed save and delete", async ({ page }) => {
  await page.goto("/library");
  const search = page.getByRole("searchbox", { name: "Search" });
  await search.fill("Parasite Kiseju : T1");
  await page.waitForURL(/search=/);
  const bookLink = page
    .getByRole("link", { name: /Parasite Kiseju : T1/ })
    .first();
  const href = await bookLink.getAttribute("href");
  await page.goto(href!);

  await expect(page.getByRole("heading", { name: /Parasite/ })).toBeVisible();
  await page.getByRole("button", { name: "Edit" }).click();

  const titleInput = page.locator("#edit-book-title, input").filter({ hasText: "" }).first();
  // Prefer labeled title field in essentials section
  const titleField = page.getByRole("textbox", { name: /Title/i }).or(
    page.locator('input[value*="Parasite"]').first()
  );
  await titleField.first().fill("Parasite Kiseju : T1 (fail)");

  await page.route("**/api/books/**", async (route) => {
    if (route.request().method() === "PATCH") {
      await route.fulfill({ status: 500, body: "{}" });
      return;
    }
    await route.continue();
  });

  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Save failed")).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  // Confirm leave if unsaved guard appears
  page.once("dialog", (d) => d.accept());
  await page.unroute("**/api/books/**");

  await page.route("**/api/books/**", async (route) => {
    if (route.request().method() === "DELETE") {
      await route.fulfill({ status: 500, body: "{}" });
      return;
    }
    await route.continue();
  });

  await page.getByRole("button", { name: "Delete" }).click();
  const deleteDialog = page.getByRole("alertdialog").or(page.getByRole("dialog"));
  await expect(deleteDialog.first()).toBeVisible();
  await deleteDialog.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("Delete failed")).toBeVisible();
  await page.unroute("**/api/books/**");
});
