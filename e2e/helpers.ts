import { expect, type APIRequestContext, type Page } from "@playwright/test";

export const PASSWORD = "Trial2026!";
export const USERS = {
  maria: "maria.lopez@example.com",
  james: "james.cook@example.com",
  sunrise: "admin@sunrisehealth.example",
  metro: "admin@metrocare.example",
  admin: "alex.kim@example.com",
} as const;

/** Restore the exact spec seed so every test starts from the same state. */
export async function resetData(request: APIRequestContext): Promise<void> {
  const login = await request.post("/api/auth/login", {
    data: { email: USERS.admin, password: PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const { token } = (await login.json()) as { token: string };
  const res = await request.post("/api/admin/reset", {
    headers: { authorization: `Bearer ${token}` },
  });
  expect(res.ok()).toBeTruthy();
}

export async function signIn(page: Page, email: string): Promise<void> {
  await page.goto("/login");
  await page.getByTestId("login-email-input").fill(email);
  await page.getByTestId("login-password-input").fill(PASSWORD);
  await page.getByTestId("login-submit-button").click();
}
