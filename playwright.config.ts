import { defineConfig, devices } from "@playwright/test";

const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
// Off the default 3000 so a local dev server or container on 3000 doesn't collide.
const port = Number(process.env.E2E_PORT ?? 4310);

export default defineConfig({
  testDir: "e2e",
  // Flows share one database; run serially and reset seed data before each test.
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: externalBaseUrl ?? `http://localhost:${port}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: externalBaseUrl
    ? undefined
    : {
        command: process.env.CI ? `npm run start -- -p ${port}` : `npm run dev -- -p ${port}`,
        url: `http://localhost:${port}/login`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
