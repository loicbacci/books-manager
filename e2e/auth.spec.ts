import { test, expect } from "@playwright/test";

test("login page renders the form and links to register", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Log in" })).toBeEnabled();

  await page.getByRole("link", { name: "Register" }).first().click();
  await expect(page).toHaveURL(/\/(en\/)?register/);
});

test("register form shows a password mismatch error", async ({ page }) => {
  await page.goto("/register");

  await page.getByLabel("Email").fill("test@example.com");
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByLabel("Confirm password").fill("password124");
  await page.getByLabel("Invite code").fill("INVITE-CODE");

  await page.getByRole("button", { name: "Register" }).click();

  await expect(page.getByText("Passwords do not match")).toBeVisible();
});
