import type { Page } from "@playwright/test";

const now = new Date().toISOString();

export type SprintRecord = {
  id: string;
  name: string;
  status: "planned" | "active" | "closed";
  objective?: string;
  tasks: unknown[];
  startDate?: string;
  endDate?: string;
  version?: string;
};

/**
 * Registers common API route mocks shared across E2E specs.
 *
 * Stubs: /api/workspace, /api/projects (single project "Alpha"),
 * /api/projects/proj-1/sprints (GET list + POST create),
 * /api/projects/proj-1/documents, /api/members.
 *
 * The `sprints` array is mutated in-place by POST handlers so callers can
 * inspect created sprints after test actions.
 */
export async function setupCommonRoutes(
  page: Page,
  sprints: SprintRecord[] = []
): Promise<void> {
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
      const created: SprintRecord = {
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
}
