import { describe, it, expect } from "vitest";
import type { ProjectContext, SupportedAction, ActionChain, ChainExecutionState } from "../interpret";

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

  it("ActionChain wraps one or more ActionIntents", () => {
    const chain: ActionChain = {
      id: "test-chain-1",
      steps: [
        {
          action: "update_task_status",
          params: { taskQuery: "T1.1", newStatus: "done" },
          preview: "Mark T1.1 as done",
          confidence: 0.95,
        },
        {
          action: "refresh_project",
          params: {},
          preview: "Refresh project",
          confidence: 0.9,
        },
      ],
    };
    expect(chain.steps).toHaveLength(2);
    expect(chain.steps[0].action).toBe("update_task_status");
    expect(chain.steps[1].action).toBe("refresh_project");
    expect(chain.id).toBe("test-chain-1");
  });

  it("ChainExecutionState tracks step-by-step progress", () => {
    const state: ChainExecutionState = {
      chain: {
        id: "test-chain-2",
        steps: [
          { action: "navigate", params: { page: "sprints" }, preview: "Go to sprints", confidence: 0.9 },
          { action: "search", params: { query: "blocked" }, preview: "Search for blocked", confidence: 0.8 },
        ],
      },
      currentStep: 1,
      results: {
        0: { success: true },
      },
      status: "executing",
    };
    expect(state.currentStep).toBe(1);
    expect(state.results[0].success).toBe(true);
    expect(state.status).toBe("executing");
  });
});
