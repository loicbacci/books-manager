import { test, expect } from "@playwright/test";

const openNavIfMobile = async (page: import("@playwright/test").Page) => {
  const menuButton = page.getByRole("button", { name: "Open menu" });
  if (await menuButton.isVisible()) {
    await menuButton.click();
  }
};

test.use({ storageState: { cookies: [], origins: [] } });

test("language switching stays across navigation", async ({ page }) => {
  await page.goto("/login");
  await page
    .locator('[data-scope="select"][data-part="trigger"]')
    .first()
    .click();
  await page.getByRole("option", { name: "🇫🇷 Français" }).click();

  await expect(page).toHaveURL(/\/fr\/login/);
  await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();

  await page.getByLabel("Email").fill("demo@example.com");
  await page.getByLabel("Mot de passe").fill("password123");
  await page.getByRole("button", { name: "Connexion" }).click();

  await expect(page).toHaveURL(/\/fr\/dashboard/);
  await expect(
    page.getByRole("heading", { name: "Tableau de bord" })
  ).toBeVisible();

  await openNavIfMobile(page);
  await page.getByRole("link", { name: "Ma Bibliothèque" }).click();
  await expect(page).toHaveURL(/\/fr\/library/);
  await expect(
    page.getByRole("heading", { name: "Ma Bibliothèque" })
  ).toBeVisible();
});
