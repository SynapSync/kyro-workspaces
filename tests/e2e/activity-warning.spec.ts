import { expect, test, type Page } from "@playwright/test";
import { setupCommonRoutes, type SprintRecord } from "./helpers";

const now = new Date().toISOString();

test("shows and dismisses activity warning when createActivity fails", async ({ page }) => {
  const sprints: SprintRecord[] = [];

  await setupCommonRoutes(page, sprints);

  await page.route("**/api/activities", async (route) => {
    const method = route.request().method();
    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { activities: [] } }),
      });
      return;
    }
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({
        error: { code: "INTERNAL_ERROR", message: "forced activity failure" },
      }),
    });
  });

  await page.goto("/");

  await page.getByRole("button", { name: "Sprints" }).first().click();
  await expect(page.getByRole("heading", { name: "Sprints" })).toBeVisible();
  await page.getByRole("button", { name: "Create Sprint" }).first().click();
  await page.getByLabel("Sprint Name").fill("E2E Warning Sprint");
  await page.getByLabel("Sprint Name").press("Enter");

  await expect(page.getByText("Activity log warning")).toBeVisible();
  await expect(page.getByText(/Project:\s*Alpha/)).toBeVisible();
  await expect(page.getByText(/Sprint:\s*E2E Warning Sprint/)).toBeVisible();
  await expect(page.getByText(/Agent:\s*—/)).toBeVisible();

  await page.getByRole("button", { name: "Dismiss activity warning" }).click();
  await expect(page.getByText("Activity log warning")).toBeHidden();
  await expect(page.getByText(/Project:\s*Alpha/)).toBeVisible();
  await expect(page.getByText(/Agent:\s*—/)).toBeVisible();
});

test("shows warning on /api/activities timeout and keeps context panel stable", async ({
  page,
}: {
  page: Page;
}) => {
  const sprints: SprintRecord[] = [];

  await setupCommonRoutes(page, sprints);

  await page.route("**/api/activities", async (route) => {
    const method = route.request().method();
    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { activities: [] } }),
      });
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 2_500));
    try {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            activity: {
              id: "delayed-activity",
              projectId: "proj-1",
              actionType: "created_sprint",
              description: "Delayed activity",
              timestamp: now,
              metadata: { agent: "timeout-route" },
            },
          },
        }),
      });
    } catch {
      // Request may already be aborted by client timeout.
    }
  });

  await page.goto("/");

  await page.getByRole("button", { name: "Sprints" }).first().click();
  await expect(page.getByRole("heading", { name: "Sprints" })).toBeVisible();
  await page.getByRole("button", { name: "Create Sprint" }).first().click();
  await page.getByLabel("Sprint Name").fill("Timeout Warning Sprint");
  await page.getByLabel("Sprint Name").press("Enter");

  await expect(page.getByText("Activity log warning")).toBeVisible();
  await expect(page.getByText(/Project:\s*Alpha/)).toBeVisible();
  await expect(page.getByText(/Sprint:\s*Timeout Warning Sprint/)).toBeVisible();
  await expect(page.getByText(/Agent:\s*—/)).toBeVisible();

  await page.getByRole("button", { name: "Dismiss activity warning" }).click();
  await expect(page.getByText("Activity log warning")).toBeHidden();
  await expect(page.getByText(/Project:\s*Alpha/)).toBeVisible();
  await expect(page.getByText(/Sprint:\s*Timeout Warning Sprint/)).toBeVisible();
  await expect(page.getByText(/Agent:\s*—/)).toBeVisible();
});
