import type { Page } from "@playwright/test";

const now = new Date().toISOString();

export type SprintRecord = {
  id: string;
  name: string;
  status: "planned" | "active" | "closed";
  objective?: string;
  sprintType?: string;
  tasks: TaskRecord[];
  startDate?: string;
  endDate?: string;
  version?: string;
  phases?: PhaseRecord[];
  debtItems?: DebtRecord[];
  sections?: Record<string, string>;
};

export type TaskRecord = {
  id: string;
  title: string;
  status: string;
  priority: string;
  taskRef?: string;
  description?: string;
  assignee?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
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

export type PhaseRecord = {
  id: string;
  name: string;
  objective: string;
  isEmergent: boolean;
  tasks: TaskRecord[];
};

export type DebtRecord = {
  number: number;
  item: string;
  origin: string;
  sprintTarget: string;
  status: string;
  resolvedIn: string;
};

/** Default test project with sprints, tasks, findings */
export const TEST_PROJECT = {
  id: "proj-e2e",
  name: "E2E Project",
  description: "Test project for E2E specs",
  color: "bg-primary",
  readme: "# E2E Project\n\nTest project for end-to-end testing.",
  documents: [
    {
      id: "doc-1",
      title: "Test Document",
      content: "# Test Doc\n\nSome content here.",
      createdAt: now,
      updatedAt: now,
    },
  ],
} as const;

export const DEFAULT_SPRINTS: SprintRecord[] = [
  {
    id: "sprint-1",
    name: "Sprint 1 — Foundation",
    status: "closed",
    sprintType: "refactor",
    tasks: [
      { id: "t1", title: "Setup types", status: "done", priority: "medium", taskRef: "T1.1", tags: [], createdAt: now, updatedAt: now },
      { id: "t2", title: "Add parsers", status: "done", priority: "medium", taskRef: "T1.2", tags: [], createdAt: now, updatedAt: now },
    ],
    phases: [
      {
        id: "phase-1-1",
        name: "Phase 1 — Type System",
        objective: "Create domain types",
        isEmergent: false,
        tasks: [
          { id: "t1", title: "Setup types", status: "done", priority: "medium", taskRef: "T1.1", tags: [], createdAt: now, updatedAt: now },
          { id: "t2", title: "Add parsers", status: "done", priority: "medium", taskRef: "T1.2", tags: [], createdAt: now, updatedAt: now },
        ],
      },
    ],
    debtItems: [
      { number: 1, item: "Missing tests", origin: "Sprint 1 Phase 1", sprintTarget: "Sprint 2", status: "open", resolvedIn: "" },
    ],
    sections: {
      retrospective: "## Retro\nGood sprint.",
      recommendations: "1. Add more tests",
    },
  },
  {
    id: "sprint-2",
    name: "Sprint 2 — Core Features",
    status: "active",
    sprintType: "feature",
    tasks: [
      { id: "t3", title: "Build kanban board", status: "in_progress", priority: "high", taskRef: "T2.1", tags: [], createdAt: now, updatedAt: now },
      { id: "t4", title: "Add command palette", status: "pending", priority: "medium", taskRef: "T2.2", tags: [], createdAt: now, updatedAt: now },
      { id: "t5", title: "Implement search", status: "done", priority: "medium", taskRef: "T2.3", tags: [], createdAt: now, updatedAt: now },
      { id: "t6", title: "Resolve API timeout", status: "blocked", priority: "high", taskRef: "T2.4", tags: [], createdAt: now, updatedAt: now },
      { id: "t7", title: "Legacy migration", status: "skipped", priority: "low", taskRef: "T2.5", tags: [], createdAt: now, updatedAt: now },
      { id: "t8", title: "Deferred auth work", status: "carry_over", priority: "medium", taskRef: "T2.6", tags: [], createdAt: now, updatedAt: now },
    ],
    phases: [
      {
        id: "phase-2-1",
        name: "Phase 1 — Interactive Features",
        objective: "Build interactive UI components",
        isEmergent: false,
        tasks: [
          { id: "t3", title: "Build kanban board", status: "in_progress", priority: "high", taskRef: "T2.1", tags: [], createdAt: now, updatedAt: now },
          { id: "t4", title: "Add command palette", status: "pending", priority: "medium", taskRef: "T2.2", tags: [], createdAt: now, updatedAt: now },
          { id: "t5", title: "Implement search", status: "done", priority: "medium", taskRef: "T2.3", tags: [], createdAt: now, updatedAt: now },
          { id: "t6", title: "Resolve API timeout", status: "blocked", priority: "high", taskRef: "T2.4", tags: [], createdAt: now, updatedAt: now },
          { id: "t7", title: "Legacy migration", status: "skipped", priority: "low", taskRef: "T2.5", tags: [], createdAt: now, updatedAt: now },
          { id: "t8", title: "Deferred auth work", status: "carry_over", priority: "medium", taskRef: "T2.6", tags: [], createdAt: now, updatedAt: now },
        ],
      },
    ],
  },
];

export const DEFAULT_FINDINGS: FindingRecord[] = [
  {
    id: "f-01",
    number: 1,
    title: "Architecture Layer Violations",
    summary: "Components import directly from data layer",
    severity: "medium",
    details: "Detailed analysis of architecture violations found in the codebase.",
    affectedFiles: ["lib/store.ts", "components/app.tsx"],
    recommendations: ["Add service layer abstraction"],
  },
];

/**
 * Registers common API route mocks shared across E2E specs.
 *
 * The app runs in file mode (NEXT_PUBLIC_USE_MOCK_DATA=false),
 * so FileProjectsService makes fetch() calls to API routes.
 * page.route() intercepts these browser-level requests.
 */
export const DEFAULT_GRAPH_DATA = {
  nodes: [
    { id: "readme", label: "README", filePath: "/proj/README.md", fileType: "readme", tags: ["project"] },
    { id: "roadmap", label: "ROADMAP", filePath: "/proj/ROADMAP.md", fileType: "roadmap", tags: ["project", "plan"] },
    { id: "sprint-01", label: "SPRINT-01", filePath: "/proj/sprints/SPRINT-01.md", fileType: "sprint", tags: ["sprint-1"] },
    { id: "finding-01", label: "01-architecture", filePath: "/proj/findings/01-arch.md", fileType: "finding", tags: ["architecture"] },
    { id: "doc-01", label: "guide", filePath: "/proj/documents/guide.md", fileType: "document", tags: ["project", "guide"] },
  ],
  edges: [
    { id: "e1", source: "readme", target: "roadmap", edgeType: "wiki-link", label: "ROADMAP", weight: 1.0 },
    { id: "e2", source: "sprint-01", target: "roadmap", edgeType: "frontmatter-ref", label: "ROADMAP", weight: 0.8 },
    { id: "e3", source: "finding-01", target: "sprint-01", edgeType: "wiki-link", label: "SPRINT-01", weight: 1.0 },
    { id: "e4", source: "readme", target: "doc-01", edgeType: "structural", weight: 0.2 },
  ],
  clusters: [
    { id: "cluster-type-sprint", label: "Sprints", nodeIds: ["sprint-01"], clusterType: "type" },
    { id: "cluster-type-finding", label: "Findings", nodeIds: ["finding-01"], clusterType: "type" },
    { id: "cluster-type-document", label: "Documents", nodeIds: ["doc-01"], clusterType: "type" },
    { id: "cluster-type-readme", label: "Readmes", nodeIds: ["readme"], clusterType: "type" },
    { id: "cluster-type-roadmap", label: "Roadmaps", nodeIds: ["roadmap"], clusterType: "type" },
  ],
  metadata: {
    projectId: "proj-e2e",
    projectName: "E2E Project",
    buildTimestamp: now,
    nodeCount: 5,
    edgeCount: 4,
  },
};

export async function setupCommonRoutes(
  page: Page,
  options: {
    sprints?: SprintRecord[];
    findings?: FindingRecord[];
  } = {}
): Promise<void> {
  const sprints = options.sprints ?? DEFAULT_SPRINTS;
  const findings = options.findings ?? DEFAULT_FINDINGS;

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
              ...TEST_PROJECT,
              sprints,
              createdAt: now,
              updatedAt: now,
            },
          ],
        },
      }),
    });
  });

  await page.route("**/api/projects/proj-e2e/sprints", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: { sprints } }),
    });
  });

  await page.route("**/api/projects/proj-e2e/findings", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: { findings } }),
    });
  });

  await page.route("**/api/projects/proj-e2e/roadmap", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          roadmap: {
            raw: "# Roadmap\n\nProject roadmap content.",
            sprints: [
              { number: 1, findingSource: "01", version: "0.1.0", type: "refactor", focus: "Foundation", dependencies: [], status: "completed" },
              { number: 2, findingSource: "02", version: "0.2.0", type: "feature", focus: "Core Features", dependencies: ["Sprint 1"], status: "pending" },
            ],
          },
        },
      }),
    });
  });

  await page.route("**/api/projects/proj-e2e/documents", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: { documents: TEST_PROJECT.documents } }),
    });
  });

  await page.route("**/api/members", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: { members: [] } }),
    });
  });

  await page.route("**/api/projects/proj-e2e/graph", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: { graph: DEFAULT_GRAPH_DATA } }),
    });
  });

  await page.route("**/api/activities", async (route) => {
    const method = route.request().method();
    if (method === "POST") {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ data: { activity: {} } }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { activities: [], diagnostics: null } }),
      });
    }
  });
}

/**
 * Navigate to a specific page via sidebar link.
 * Sidebar nav items are <Link> elements with text labels.
 */
export async function navigateTo(page: Page, label: string): Promise<void> {
  await page.getByRole("link", { name: label, exact: true }).first().click();
}

/**
 * Wait for the app to finish loading and show the main UI.
 */
export async function waitForAppReady(page: Page): Promise<void> {
  await page.waitForSelector("nav a", { timeout: 15_000 });
}
