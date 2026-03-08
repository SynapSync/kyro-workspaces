import { describe, it, expect } from "vitest";
import { assembleSprintContext, getNextSprintInfo } from "../context";
import { composeSprintForgePrompt } from "../prompt-composer";
import type { Project, Finding, RoadmapSprintEntry } from "@/lib/types";

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

function makeRoadmapEntry(overrides: Partial<RoadmapSprintEntry> = {}): RoadmapSprintEntry {
  return {
    number: 1,
    sprintId: "sprint-1",
    version: "1.0.0",
    type: "feature",
    focus: "Build stuff",
    status: "pending",
    findingSource: "findings/01.md",
    dependencies: [],
    ...overrides,
  };
}

describe("assembleSprintContext", () => {
  it("returns empty context for empty project", () => {
    const ctx = assembleSprintContext(makeProject(), [], []);
    expect(ctx.projectName).toBe("Test Project");
    expect(ctx.lastSprint).toBeNull();
    expect(ctx.nextSprint).toBeNull();
    expect(ctx.openDebtItems).toEqual([]);
    expect(ctx.completedSprintCount).toBe(0);
  });

  it("extracts last sprint info", () => {
    const project = makeProject({
      sprints: [
        {
          id: "sprint-1",
          name: "Sprint 1 — Foundation",
          status: "closed",
          tasks: [],
        },
        {
          id: "sprint-2",
          name: "Sprint 2 — API",
          status: "active",
          tasks: [],
        },
      ],
    });
    const ctx = assembleSprintContext(project, [], []);
    expect(ctx.lastSprint).not.toBeNull();
    expect(ctx.lastSprint!.number).toBe(2);
    expect(ctx.lastSprint!.name).toBe("Sprint 2 — API");
  });

  it("extracts open debt items from sprints", () => {
    const project = makeProject({
      sprints: [
        {
          id: "sprint-1",
          name: "Sprint 1",
          status: "closed",
          tasks: [],
          debtItems: [
            { number: 1, item: "Missing tests", origin: "Sprint 1", sprintTarget: "Sprint 2", status: "open" },
            { number: 2, item: "Fixed thing", origin: "Sprint 1", sprintTarget: "Sprint 1", status: "resolved", resolvedIn: "Sprint 1" },
          ],
        },
      ],
    });
    const ctx = assembleSprintContext(project, [], []);
    expect(ctx.openDebtItems).toHaveLength(1);
    expect(ctx.openDebtItems[0].item).toBe("Missing tests");
  });

  it("counts completed sprints from roadmap", () => {
    const roadmap = [
      makeRoadmapEntry({ number: 1, status: "completed" }),
      makeRoadmapEntry({ number: 2, status: "completed" }),
      makeRoadmapEntry({ number: 3, status: "pending" }),
    ];
    const ctx = assembleSprintContext(makeProject(), [], roadmap);
    expect(ctx.completedSprintCount).toBe(2);
    expect(ctx.totalSprintCount).toBe(3);
  });
});

describe("getNextSprintInfo", () => {
  it("returns null for empty roadmap", () => {
    expect(getNextSprintInfo([])).toBeNull();
  });

  it("returns null when all completed", () => {
    const roadmap = [makeRoadmapEntry({ status: "completed" })];
    expect(getNextSprintInfo(roadmap)).toBeNull();
  });

  it("returns first non-completed sprint", () => {
    const roadmap = [
      makeRoadmapEntry({ number: 1, status: "completed" }),
      makeRoadmapEntry({ number: 2, status: "pending", focus: "Next work" }),
    ];
    const next = getNextSprintInfo(roadmap);
    expect(next).not.toBeNull();
    expect(next!.number).toBe(2);
    expect(next!.focus).toBe("Next work");
  });
});

describe("composeSprintForgePrompt", () => {
  it("composes a prompt with all sections", () => {
    const context = assembleSprintContext(
      makeProject({
        sprints: [{ id: "s1", name: "Sprint 1", status: "closed", tasks: [] }],
      }),
      [{ id: "f1", number: 1, title: "Bug", summary: "A bug", severity: "high", details: "", affectedFiles: [], recommendations: [] }],
      [
        makeRoadmapEntry({ number: 1, status: "completed" }),
        makeRoadmapEntry({ number: 2, status: "pending", version: "2.0.0", type: "refactor", focus: "Refactor stuff" }),
      ],
    );

    const prompt = composeSprintForgePrompt(context, {
      selectedFindingIds: ["f1"],
      selectedDebtNumbers: [],
      versionTarget: "2.0.0",
      sprintType: "refactor",
      customNotes: "",
    });

    expect(prompt).toContain("Test Project");
    expect(prompt).toContain("Sprint 2");
    expect(prompt).toContain("2.0.0");
    expect(prompt).toContain("refactor");
    expect(prompt).toContain("Bug (high)");
  });

  it("handles empty selections", () => {
    const context = assembleSprintContext(makeProject(), [], []);
    const prompt = composeSprintForgePrompt(context, {
      selectedFindingIds: [],
      selectedDebtNumbers: [],
      versionTarget: "1.0.0",
      sprintType: "feature",
      customNotes: "",
    });

    expect(prompt).toContain("Test Project");
    expect(prompt).toContain("Sprint 1");
  });
});
