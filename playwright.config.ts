import { defineConfig } from "@playwright/test";

const E2E_BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:4173";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  workers: "50%",
  retries: 1,
  reporter: "list",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: E2E_BASE_URL,
    headless: true,
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    command: "pnpm exec next build && pnpm exec next start --hostname 127.0.0.1 --port 4173",
    url: E2E_BASE_URL,
    reuseExistingServer: true,
    timeout: 180_000,
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
});
