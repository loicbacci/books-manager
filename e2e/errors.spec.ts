import { test, expect } from "@playwright/test";

test("error toasts appear on failed save and delete", async ({ page }) => {
  await page.goto("/library");
  const search = page.getByRole("searchbox", { name: "Search" });
  await search.fill("Parasite Kiseju : T1");
  await page.getByText("Parasite Kiseju : T1").first().click();

  await page.getByRole("button", { name: "Edit" }).click();
  const titleField = page.getByText("Title").locator("..").locator("input");
  await titleField.fill("Parasite Kiseju : T1 (fail)");

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
  await page.unroute("**/api/books/**");

  await page.route("**/api/books/**", async (route) => {
    if (route.request().method() === "DELETE") {
      await route.fulfill({ status: 500, body: "{}" });
      return;
    }
    await route.continue();
  });

  await page.getByRole("button", { name: "Delete" }).click();
  const deleteDialog = page.getByRole("dialog");
  await expect(deleteDialog).toBeVisible();
  await deleteDialog.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("Delete failed")).toBeVisible();
  await page.unroute("**/api/books/**");
});
