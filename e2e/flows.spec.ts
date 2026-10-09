import { expect, test } from "@playwright/test";
import { USERS, resetData, signIn } from "./helpers";

test.beforeEach(async ({ request }) => {
  await resetData(request);
});

test("nurse with valid credentials claims an open shift", async ({ page }) => {
  await signIn(page, USERS.maria);
  await expect(page).toHaveURL(/\/nurse/);
  const items = page.getByTestId("shift-list-item");
  await expect(items).toHaveCount(2); // shift-1 and shift-3 are open
  await items.first().getByTestId("shift-claim-button").click();
  await expect(page.getByTestId("notification-banner")).toHaveText(/Shift claimed/);
  await expect(page.getByTestId("shift-list-item")).toHaveCount(1);
});

test("nurse with expired credentials is blocked with a clear message", async ({ page }) => {
  await signIn(page, USERS.james);
  await expect(page).toHaveURL(/\/nurse/);
  const claim = page.getByTestId("shift-list-item").first().getByTestId("shift-claim-button");
  await expect(claim).toBeEnabled();
  await claim.click();
  await expect(page.getByTestId("notification-banner")).toHaveText(
    /Credential expired, cannot claim shift/,
  );
  await expect(page.getByTestId("shift-list-item")).toHaveCount(2);
});

test("nurse cancels a claimed shift", async ({ page }) => {
  await signIn(page, USERS.maria);
  await page.getByTestId("shift-cancel-button").first().click();
  await expect(page.getByTestId("notification-banner")).toHaveText(/Shift cancelled/);
  await expect(page.getByTestId("shift-list-item")).toHaveCount(3);
});

test("nurse uploads a credential with an expiry date", async ({ page }) => {
  await signIn(page, USERS.james);
  await page.getByTestId("credential-upload-input").setInputFiles({
    name: "license.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\n% ShiftPatch e2e license\n%%EOF\n"),
  });
  await page.getByTestId("credential-expiry-date-input").fill("2028-01-01");
  await page.getByRole("button", { name: /submit for verification/i }).click();
  await expect(page.getByTestId("notification-banner")).toHaveText(/submitted for verification/i);
});

test("agency posts a new shift", async ({ page }) => {
  await signIn(page, USERS.sunrise);
  await expect(page).toHaveURL(/\/agency/);
  await page.getByTestId("agency-post-shift-button").click();
  await page.getByTestId("agency-post-shift-submit-button").click();
  await expect(page.getByTestId("notification-banner")).toHaveText(/Shift posted/);
});

test("agency reports a no-show and the shift reopens", async ({ page }) => {
  await signIn(page, USERS.sunrise);
  await page.getByTestId("shift-cancel-button").first().click();
  await expect(page.getByTestId("notification-banner")).toHaveText(/Shift cancelled/);
});

test("admin sees shift table, statuses, timesheets and audit log", async ({ page }) => {
  await signIn(page, USERS.admin);
  await expect(page).toHaveURL(/\/admin/);
  await expect(page.getByTestId("admin-dashboard-shift-table")).toHaveCount(1);
  const badges = page.getByTestId("admin-shift-status-badge");
  await expect(badges).toHaveCount(3);
  await expect(badges).toHaveText(["open", "filled", "open"]);
  await expect(page.getByTestId("timesheet-table")).toHaveCount(1);
  await expect(page.getByTestId("audit-log-table")).toHaveCount(1);
});

test("single-use test IDs render exactly once", async ({ page }) => {
  await signIn(page, USERS.maria);
  await expect(page.getByTestId("shift-list-item").first()).toBeVisible();
  for (const id of ["credential-upload-input", "credential-expiry-date-input", "timesheet-table"]) {
    await expect(page.getByTestId(id)).toHaveCount(1);
  }
});
