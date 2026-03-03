import { expect, test } from "@playwright/test";

const now = new Date().toISOString();

test("agent context panel shows active project, sprint and agent", async ({ page }) => {
  await page.route("**/api/workspace", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          workspace: {
            id: "ws-main",
            name: "Kyro E2E",
            rootPath: "/tmp/kyro",
            createdAt: now,
            updatedAt: now,
          },
        },
      }),
    });
  });

  await page.route("**/api/projects", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          projects: [
            {
              id: "proj-1",
              name: "Alpha",
              description: "",
              readme: "# Alpha",
              createdAt: now,
              updatedAt: now,
            },
          ],
        },
      }),
    });
  });

  await page.route("**/api/projects/proj-1/sprints", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          sprints: [
            {
              id: "sprint-1",
              name: "Sprint 1",
              status: "active",
              objective: "Validate context panel",
              tasks: [],
              sections: {},
              startDate: now,
              version: "1.5.0",
            },
          ],
        },
      }),
    });
  });

  await page.route("**/api/projects/proj-1/documents", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: { documents: [] } }),
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
