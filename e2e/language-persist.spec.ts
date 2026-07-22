import { test, expect } from "@playwright/test";

const assertLocale = async (
  page: import("@playwright/test").Page,
  locale: "en" | "fr"
) => {
  if (locale === "en") {
    await expect(page).not.toHaveURL(/\/fr\//);
    return;
  }
  await expect(page).toHaveURL(/\/fr\//);
};

test.use({ storageState: { cookies: [], origins: [] } });

test("locale stays in EN across navigation", async ({ page }) => {
  await page.goto("/en/login");
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();

  await page.getByLabel("Email").fill("demo@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Log in" }).click();

  await assertLocale(page, "en");
  await expect(page.getByText("Dashboard").first()).toBeVisible();

  await page.getByRole("link", { name: "My Library" }).click();
  await assertLocale(page, "en");
  await expect(page).toHaveURL(/\/library/);

  await page.getByRole("link", { name: "Authors" }).click();
  await assertLocale(page, "en");
  await expect(page).toHaveURL(/\/authors/);
});

test("locale stays in FR across navigation", async ({ page }) => {
  await page.goto("/fr/login");
  await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();

  await page.getByLabel("Email").fill("demo@example.com");
  await page.getByLabel("Mot de passe").fill("password123");
  await page.getByRole("button", { name: "Connexion" }).click();

  await expect(page).toHaveURL(/\/fr\/(dashboard)?/);
  await assertLocale(page, "fr");

  await page.getByRole("link", { name: "Ma Bibliothèque" }).click();
  await assertLocale(page, "fr");
  await expect(page).toHaveURL(/\/fr\/library/);

  await page.getByRole("link", { name: "Auteur·ices" }).click();
  await assertLocale(page, "fr");
  await expect(page).toHaveURL(/\/fr\/authors/);
});
