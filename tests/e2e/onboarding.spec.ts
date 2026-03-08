import { expect, test } from "@playwright/test";

test("workspace onboarding initializes and reaches ready state", async ({ page }) => {
  let initialized = false;

  await page.route("**/api/workspace/init", async (route) => {
    initialized = true;
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ data: { initialized: true } }),
    });
  });

  await page.route("**/api/workspace", async (route) => {
    if (!initialized) {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ data: { needsInit: true } }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          workspace: {
            id: "ws-e2e",
            name: "E2E Workspace",
            rootPath: "/tmp/e2e",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
      }),
    });
  });

  await page.route("**/api/projects", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: { projects: [] } }),
    });
  });

  await page.route("**/api/members", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: { members: [] } }),
    });
  });

  await page.route("**/api/activities", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: { activities: [], diagnostics: null } }),
    });
  });

  // Navigate to a workspace route (not /) so WorkspaceShell renders
  await page.goto("/init/overview");

  await expect(page.getByText("Initialize workspace")).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: "Create workspace files" }).click();

  await expect(page.getByText("Workspace is ready")).toBeVisible({ timeout: 10_000 });
});
