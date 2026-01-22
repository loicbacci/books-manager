import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export async function loginAsDemo(page: Page) {
  const csrfResponse = await page.request.get("/api/auth/csrf");
  const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };

  const baseUrl = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
  const callbackUrl = `${baseUrl}/dashboard`;
  const signInResponse = await page.request.post(
    "/api/auth/callback/credentials",
    {
      form: {
        csrfToken,
        email: "demo@example.com",
        password: "password123",
        callbackUrl,
        json: "true",
      },
    }
  );

  if (!signInResponse.ok()) {
    throw new Error(
      `Failed to sign in (status ${signInResponse.status()}).`
    );
  }

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/(en\/)?dashboard/);
}
