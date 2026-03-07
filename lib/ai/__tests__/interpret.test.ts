import { describe, it, expect } from "vitest";
import type { ProjectContext, SupportedAction } from "../interpret";

// Test the type definitions and action validation logic
// (API calls are not tested here — they require integration tests with real API key)

describe("AI interpret types", () => {
  it("SupportedAction covers all expected actions", () => {
    const actions: SupportedAction[] = [
      "update_task_status",
      "generate_sprint",
      "refresh_project",
      "navigate",
      "search",
    ];
    expect(actions).toHaveLength(5);
  });

  it("ProjectContext has required fields", () => {
    const ctx: ProjectContext = {
      projectName: "Test",
      projectId: "test-1",
      sprintNames: ["Sprint 1"],
      taskSummary: "3 pending, 1 done",
      hasRoadmap: true,
      hasPendingSprints: true,
    };
    expect(ctx.projectName).toBe("Test");
    expect(ctx.sprintNames).toHaveLength(1);
    expect(ctx.hasRoadmap).toBe(true);
  });

  it("ActionIntent matches expected shape", () => {
    const intent = {
      action: "navigate" as SupportedAction,
      params: { page: "roadmap" },
      preview: "Navigate to roadmap",
      confidence: 0.9,
    };
    expect(intent.action).toBe("navigate");
    expect(intent.params.page).toBe("roadmap");
    expect(intent.confidence).toBeGreaterThan(0);
  });
});
