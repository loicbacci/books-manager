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

const openNavIfMobile = async (page: import("@playwright/test").Page) => {
  const menuButton = page.getByRole("button", { name: "Open menu" });
  if (await menuButton.isVisible()) {
    await menuButton.click();
  }
};

test.use({ storageState: { cookies: [], origins: [] } });

test("locale stays in EN across navigation", async ({ page }) => {
  await page.goto("/en/login");
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();

  await page.getByLabel("Email").fill("demo@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Log in" }).click();

  await assertLocale(page, "en");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  await openNavIfMobile(page);
  await page.getByRole("link", { name: "My Library" }).click();
  await assertLocale(page, "en");
  await expect(page.getByRole("heading", { name: "My Library" })).toBeVisible();

  await openNavIfMobile(page);
  await page.getByRole("link", { name: "Authors" }).click();
  await assertLocale(page, "en");
  await expect(page.getByRole("heading", { name: "Authors" })).toBeVisible();
});

test("locale stays in FR across navigation", async ({ page }) => {
  await page.goto("/fr/login");
  await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();

  await page.getByLabel("Email").fill("demo@example.com");
  await page.getByLabel("Mot de passe").fill("password123");
  await page.getByRole("button", { name: "Connexion" }).click();

  await assertLocale(page, "fr");
  await expect(
    page.getByRole("heading", { name: "Tableau de bord" })
  ).toBeVisible();

  await openNavIfMobile(page);
  await page.getByRole("link", { name: "Ma Bibliothèque" }).click();
  await assertLocale(page, "fr");
  await expect(
    page.getByRole("heading", { name: "Ma Bibliothèque" })
  ).toBeVisible();

  await openNavIfMobile(page);
  await page.getByRole("link", { name: "Auteur·ices" }).click();
  await assertLocale(page, "fr");
  await expect(page.getByRole("heading", { name: "Auteur·ices" })).toBeVisible();
});
