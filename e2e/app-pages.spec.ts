import { test, expect } from "@playwright/test";
import { loginAsDemo } from "./utils/auth";

test.describe("authenticated pages", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test("dashboard shows stats", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Dashboard" })
    ).toBeVisible();
    await expect(page.getByText("Books read")).toBeVisible();
  });

  test("library shows seeded books", async ({ page }) => {
    await page.goto("/library");
    await expect(
      page.getByRole("heading", { name: "My Library" })
    ).toBeVisible();
    await expect(page.getByText("Other girls")).toBeVisible();
  });

  test("book detail page loads from library", async ({ page }) => {
    await page.goto("/library");
    await page.getByText("Other girls").first().click();
    await expect(
      page.getByRole("heading", { name: "Other girls" })
    ).toBeVisible();
    await expect(page.getByText("Rating")).toBeVisible();
  });

  test("authors list and detail page load", async ({ page }) => {
    await page.goto("/authors");
    await expect(
      page.getByRole("heading", { name: "Authors" })
    ).toBeVisible();
    await page.getByText("Harper Lee").first().click();
    await expect(
      page.getByRole("heading", { name: "Harper Lee" })
    ).toBeVisible();
  });

  test("series list and detail page load", async ({ page }) => {
    await page.goto("/series");
    await expect(page.getByRole("heading", { name: "Series" })).toBeVisible();
    await page.getByText("Parasite Kiseju").first().click();
    await expect(
      page.getByRole("heading", { name: "Parasite Kiseju" })
    ).toBeVisible();
  });

  test("statistics page renders summary", async ({ page }) => {
    await page.goto("/statistics");
    await expect(
      page.getByRole("heading", { name: "Statistics" })
    ).toBeVisible();
    await expect(page.getByText("Books read")).toBeVisible();
  });

  test("settings page renders profile section", async ({ page }) => {
    await page.goto("/settings");
    await expect(
      page.getByRole("heading", { name: "Settings" })
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();
  });
});
