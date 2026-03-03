import { expect, test } from "@playwright/test";

const now = new Date().toISOString();

test("shows and dismisses activity warning when createActivity fails", async ({ page }) => {
  const sprints: Array<{
    id: string;
    name: string;
    status: "planned" | "active" | "closed";
    objective?: string;
    tasks: unknown[];
    startDate?: string;
    endDate?: string;
    version?: string;
  }> = [];

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
    const method = route.request().method();
    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { sprints } }),
      });
      return;
    }

    if (method === "POST") {
      const payload = route.request().postDataJSON() as {
        id: string;
        name: string;
        status?: "planned" | "active" | "closed";
        objective?: string;
        startDate?: string;
        endDate?: string;
        version?: string;
      };
      const created = {
        id: payload.id,
        name: payload.name,
        status: payload.status ?? "planned",
        objective: payload.objective,
        tasks: [],
        startDate: payload.startDate,
        endDate: payload.endDate,
        version: payload.version,
      };
      sprints.push(created);
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ data: { sprint: created } }),
      });
      return;
    }

    await route.fulfill({
      status: 405,
      contentType: "application/json",
      body: JSON.stringify({ error: { message: `Unsupported method ${method}` } }),
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

  await page.getByRole("button", { name: "Dismiss activity warning" }).click();
  await expect(page.getByText("Activity log warning")).toBeHidden();
  await expect(page.getByText(/Project:\s*Alpha/)).toBeVisible();
});
