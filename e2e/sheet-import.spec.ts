import { test, expect } from "@playwright/test";
import * as XLSX from "xlsx";

test("sheet import creates books and authors", async ({ page }, testInfo) => {
  const uniqueSuffix = Date.now();
  const titleA = `E2E Imported Book A ${uniqueSuffix}`;
  const titleB = `E2E Imported Book B ${uniqueSuffix}`;
  const titleC = `E2E Imported Book C ${uniqueSuffix}`;
  const titleD = `E2E Imported Book D ${uniqueSuffix}`;

  const rows = [
    ["Authors", "Title", "Rating", "Pages"],
    ["New Author E2E", titleA, 5, 123],
    ["Nicolas Mathieu & Harper Lee", titleB, 4, 222],
    ["Holly Black", "", 3, 111],
    ["", titleC, 2, 98],
  ];

  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Books");

  const filePath = testInfo.outputPath("import.xlsx");
  XLSX.writeFile(workbook, filePath);

  await page.goto("/sheet-import");
  await page.locator('input[type="file"]').setInputFiles(filePath);

  await expect(page.getByText("Column mapping")).toBeVisible();
  await expect(page.getByText("Missing required information")).toBeVisible();

  await page.getByPlaceholder("Title (manual)").fill(titleD);
  await page.getByPlaceholder("Authors (manual)").fill("Hitoshi Iwaaki");

  await page.getByRole("button", { name: "Next", exact: true }).click();

  await expect(page.getByText("Match each found author")).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();

  await expect(page.getByText("4 books to import")).toBeVisible();

  await page.getByRole("button", { name: "Import books" }).click();
  await expect(page).toHaveURL(/\/library/);

  const search = page.getByRole("searchbox", { name: "Search" });
  await search.fill(titleA);
  await expect(page.getByText(titleA)).toBeVisible();
});
