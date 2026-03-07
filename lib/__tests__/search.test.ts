import { describe, it, expect } from "vitest";
import {
  buildSearchIndex,
  deduplicateDebtEntries,
  groupByType,
  type SearchEntry,
} from "../search";
import type { Project, Finding } from "../types";

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "proj-1",
    name: "Test Project",
    description: "A test project",
    readme: "# Test",
    documents: [],
    sprints: [],
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    ...overrides,
  };
}

function makeFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    id: "finding-1",
    number: 1,
    title: "Test Finding",
    summary: "A test finding summary",
    severity: "medium",
    details: "Details here",
    affectedFiles: ["lib/foo.ts"],
    recommendations: ["Fix it"],
    ...overrides,
  };
}

describe("buildSearchIndex", () => {
  it("returns empty array for empty input", () => {
    const result = buildSearchIndex([], {});
    expect(result).toEqual([]);
  });

  it("indexes sprints", () => {
    const project = makeProject({
      sprints: [
        {
          id: "sprint-1",
          name: "Sprint 1",
          status: "closed",
          objective: "Build the thing",
          tasks: [],
        },
      ],
    });
    const result = buildSearchIndex([project], {});
    const sprints = result.filter((e) => e.type === "sprint");
    expect(sprints).toHaveLength(1);
    expect(sprints[0].title).toBe("Sprint 1");
    expect(sprints[0].description).toBe("Build the thing");
    expect(sprints[0].navigateTo).toBe("/proj-1/sprints/sprint-1/detail");
  });

  it("indexes tasks within sprints", () => {
    const project = makeProject({
      sprints: [
        {
          id: "sprint-1",
          name: "Sprint 1",
          status: "closed",
          tasks: [
            {
              id: "task-1",
              title: "Implement search",
              description: "Build search index",
              priority: "high",
              status: "done",
              tags: [],
              taskRef: "T1.1",
              createdAt: "2026-01-01",
              updatedAt: "2026-01-01",
            },
          ],
        },
      ],
    });
    const result = buildSearchIndex([project], {});
    const tasks = result.filter((e) => e.type === "task");
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe("Implement search");
    expect(tasks[0].metadata.taskRef).toBe("T1.1");
    expect(tasks[0].navigateTo).toBe("/proj-1/sprints/sprint-1/detail");
  });

  it("indexes findings from separate store slice", () => {
    const project = makeProject();
    const findings: Record<string, Finding[]> = {
      "proj-1": [makeFinding({ number: 3, title: "Auth Bug" })],
    };
    const result = buildSearchIndex([project], findings);
    const findingEntries = result.filter((e) => e.type === "finding");
    expect(findingEntries).toHaveLength(1);
    expect(findingEntries[0].title).toBe("#03 Auth Bug");
    expect(findingEntries[0].metadata.severity).toBe("medium");
    expect(findingEntries[0].navigateTo).toBe("/proj-1/findings?finding=finding-1");
  });

  it("indexes debt items from sprints", () => {
    const project = makeProject({
      sprints: [
        {
          id: "sprint-1",
          name: "Sprint 1",
          status: "closed",
          tasks: [],
          debtItems: [
            {
              number: 1,
              item: "Missing tests",
              origin: "Sprint 1 Phase 2",
              sprintTarget: "Sprint 2",
              status: "open",
            },
          ],
        },
      ],
    });
    const result = buildSearchIndex([project], {});
    const debt = result.filter((e) => e.type === "debt");
    expect(debt).toHaveLength(1);
    expect(debt[0].title).toBe("D1: Missing tests");
    expect(debt[0].navigateTo).toBe("/proj-1/debt");
  });

  it("indexes documents", () => {
    const project = makeProject({
      documents: [
        {
          id: "doc-1",
          title: "Architecture",
          content: "# Architecture\n\nThis describes the system.",
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
        },
      ],
    });
    const result = buildSearchIndex([project], {});
    const docs = result.filter((e) => e.type === "document");
    expect(docs).toHaveLength(1);
    expect(docs[0].title).toBe("Architecture");
    expect(docs[0].navigateTo).toBe("/proj-1/documents");
  });

  it("indexes phases from sprints", () => {
    const project = makeProject({
      sprints: [
        {
          id: "sprint-1",
          name: "Sprint 1",
          status: "closed",
          tasks: [],
          phases: [
            {
              id: "phase-1",
              name: "Search Index",
              objective: "Build the search index",
              isEmergent: false,
              tasks: [],
            },
          ],
        },
      ],
    });
    const result = buildSearchIndex([project], {});
    const phases = result.filter((e) => e.type === "phase");
    expect(phases).toHaveLength(1);
    expect(phases[0].title).toBe("Search Index");
    expect(phases[0].metadata.sprint).toBe("Sprint 1");
  });

  it("handles multiple projects", () => {
    const p1 = makeProject({ id: "p1", name: "Project A", sprints: [] });
    const p2 = makeProject({
      id: "p2",
      name: "Project B",
      sprints: [
        { id: "s1", name: "Sprint 1", status: "closed" as const, tasks: [] },
      ],
    });
    const result = buildSearchIndex([p1, p2], {});
    expect(result.filter((e) => e.projectId === "p2")).toHaveLength(1);
  });

  it("handles missing optional fields gracefully", () => {
    const project = makeProject({
      sprints: [
        {
          id: "sprint-1",
          name: "Sprint 1",
          status: "planned",
          tasks: [
            {
              id: "t1",
              title: "Task",
              priority: "low",
              status: "pending",
              tags: [],
              createdAt: "2026-01-01",
              updatedAt: "2026-01-01",
              // no description, no taskRef
            },
          ],
          // no objective, no phases, no debtItems
        },
      ],
    });
    const result = buildSearchIndex([project], {});
    expect(result.length).toBeGreaterThan(0);
    const task = result.find((e) => e.type === "task");
    expect(task?.description).toBe("");
    expect(task?.metadata.taskRef).toBeUndefined();
  });
});

describe("deduplicateDebtEntries", () => {
  it("keeps only the last occurrence of each debt item", () => {
    const entries: SearchEntry[] = [
      {
        type: "debt",
        title: "D1: Missing tests",
        description: "Origin: Sprint 1",
        metadata: { status: "open", target: "Sprint 2" },
        projectId: "p1",
        projectName: "P",
        navigateTo: "/p1/debt",
      },
      {
        type: "debt",
        title: "D1: Missing tests",
        description: "Origin: Sprint 1",
        metadata: { status: "resolved", target: "Sprint 2", resolvedIn: "Sprint 2" },
        projectId: "p1",
        projectName: "P",
        navigateTo: "/p1/debt",
      },
      {
        type: "sprint",
        title: "Sprint 1",
        description: "",
        metadata: { status: "closed" },
        projectId: "p1",
        projectName: "P",
        navigateTo: "/p1/sprints/s1/detail",
      },
    ];
    const result = deduplicateDebtEntries(entries);
    const debt = result.filter((e) => e.type === "debt");
    expect(debt).toHaveLength(1);
    expect(debt[0].metadata.status).toBe("resolved");
    // Non-debt entries preserved
    expect(result.filter((e) => e.type === "sprint")).toHaveLength(1);
  });
});

describe("groupByType", () => {
  it("groups entries by their type", () => {
    const entries: SearchEntry[] = [
      { type: "sprint", title: "S1", description: "", metadata: {}, projectId: "p", projectName: "P", navigateTo: "/" },
      { type: "task", title: "T1", description: "", metadata: {}, projectId: "p", projectName: "P", navigateTo: "/" },
      { type: "task", title: "T2", description: "", metadata: {}, projectId: "p", projectName: "P", navigateTo: "/" },
      { type: "finding", title: "F1", description: "", metadata: {}, projectId: "p", projectName: "P", navigateTo: "/" },
    ];
    const grouped = groupByType(entries);
    expect(grouped.sprint).toHaveLength(1);
    expect(grouped.task).toHaveLength(2);
    expect(grouped.finding).toHaveLength(1);
    expect(grouped.debt).toHaveLength(0);
    expect(grouped.document).toHaveLength(0);
    expect(grouped.phase).toHaveLength(0);
  });
});
