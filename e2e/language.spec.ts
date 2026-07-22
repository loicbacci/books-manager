import { test, expect } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test("language switching stays across navigation", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("combobox", { name: "Language" }).click();
  await page.getByRole("option", { name: "FR" }).click();

  await expect(page).toHaveURL(/\/fr\/login/);
  await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();

  await page.getByLabel("Email").fill("demo@example.com");
  await page.getByLabel("Mot de passe").fill("password123");
  await page.getByRole("button", { name: "Connexion" }).click();

  await expect(page).toHaveURL(/\/fr\/dashboard/);
  await expect(page.getByText("Tableau de bord").first()).toBeVisible();

  await page.getByRole("link", { name: "Ma Bibliothèque" }).click();
  await expect(page).toHaveURL(/\/fr\/library/);
  await expect(page.getByRole("searchbox")).toBeVisible();
});
