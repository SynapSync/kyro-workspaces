import { expect, test } from "@playwright/test";
import { setupCommonRoutes } from "./helpers";

const now = new Date().toISOString();

test("agent context panel shows active project, sprint and agent", async ({ page }) => {
  await setupCommonRoutes(page, [
    {
      id: "sprint-1",
      name: "Sprint 1",
      status: "active",
      objective: "Validate context panel",
      tasks: [],
      startDate: now,
      version: "1.5.0",
    },
  ]);

  await page.route("**/api/activities", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          activities: [
            {
              id: "act-1",
              projectId: "proj-1",
              actionType: "created_sprint",
              description: "Sprint Forge created Sprint 1",
              timestamp: now,
              metadata: { agent: "Sprint Forge" },
            },
          ],
        },
      }),
    });
  });

  await page.goto("/");

  await expect(page.getByText(/Project:\s*Alpha/)).toBeVisible();
  await expect(page.getByText(/Sprint:\s*Sprint 1/)).toBeVisible();
  await expect(page.getByText(/Agent:\s*Sprint Forge/)).toBeVisible();
});
