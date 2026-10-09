import { expect, test } from "@playwright/test";
import { USERS, signIn } from "./helpers";

// Phone width: content may scroll inside table wrappers, but never the page itself.
test.use({ viewport: { width: 375, height: 812 } });

async function expectNoHorizontalScroll(page: import("@playwright/test").Page) {
  await page.waitForLoadState("networkidle");
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(375);
}

test("public pages fit a phone screen", async ({ page }) => {
  await page.goto("/");
  await expectNoHorizontalScroll(page);
  await page.goto("/login");
  await expectNoHorizontalScroll(page);
});

for (const [role, email, path] of [
  ["nurse", USERS.maria, /\/nurse/],
  ["agency", USERS.sunrise, /\/agency/],
  ["admin", USERS.admin, /\/admin/],
] as const) {
  test(`${role} dashboard fits a phone screen`, async ({ page }) => {
    await signIn(page, email);
    await expect(page).toHaveURL(path);
    await expectNoHorizontalScroll(page);
  });
}
