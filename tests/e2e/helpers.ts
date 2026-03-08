import type { Page } from "@playwright/test";

const now = new Date().toISOString();

export type SprintRecord = {
  id: string;
  name: string;
  status: "planned" | "active" | "closed";
  objective?: string;
  sprintType?: string;
  tasks: unknown[];
  startDate?: string;
  endDate?: string;
  version?: string;
  phases?: unknown[];
  debtItems?: unknown[];
  sections?: Record<string, string>;
};

export type FindingRecord = {
  id: string;
  number: number;
  title: string;
  summary: string;
  severity: string;
  details: string;
  affectedFiles: string[];
  recommendations: string[];
};

/**
 * Registers common API route mocks shared across E2E specs.
 *
 * Stubs: /api/workspace, /api/projects (single project "Alpha"),
 * /api/projects/proj-1/sprints, /api/projects/proj-1/findings,
 * /api/projects/proj-1/roadmap, /api/members, /api/activities.
 */
export async function setupCommonRoutes(
  page: Page,
  options: {
    sprints?: SprintRecord[];
    findings?: FindingRecord[];
  } = {}
): Promise<void> {
  const sprints = options.sprints ?? [];
  const findings = options.findings ?? [];

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
              description: "Test project",
              readme: "# Alpha",
              documents: [],
              sprints,
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
      body: JSON.stringify({ data: { sprints } }),
    });
  });

  await page.route("**/api/projects/proj-1/findings", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: { findings } }),
    });
  });

  await page.route("**/api/projects/proj-1/roadmap", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          roadmap: {
            raw: "# Roadmap",
            sprints: [
              { number: 1, findingSource: "01", version: "0.1.0", type: "refactor", focus: "Foundation", dependencies: [], status: "completed" },
              { number: 2, findingSource: "02", version: "0.2.0", type: "feature", focus: "UI Polish", dependencies: ["Sprint 1"], status: "pending" },
            ],
          },
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
      body: JSON.stringify({ data: { activities: [], diagnostics: null } }),
    });
  });
}
