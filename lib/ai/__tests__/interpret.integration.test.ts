import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ProjectContext, ActionIntent, ActionChain } from "../interpret";

// ---------------------------------------------------------------------------
// Mock the Anthropic SDK
// ---------------------------------------------------------------------------

const mockCreate = vi.fn();

vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: class MockAnthropic {
      messages = { create: mockCreate };
    },
  };
});

// Set API key before importing the module under test
vi.stubEnv("ANTHROPIC_API_KEY", "test-key-123");

// Import after mocking
const { interpretInstruction, validateChain } = await import("../interpret");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TEST_CONTEXT: ProjectContext = {
  projectName: "Kyro",
  projectId: "kyro-main",
  sprintNames: ["Sprint 1 — Foundation", "Sprint 2 — Core Features"],
  taskSummary: "5 pending, 3 in_progress, 8 done",
  hasRoadmap: true,
  hasPendingSprints: true,
};

/** Mock API returning new chain format */
function mockChainResponse(steps: ActionIntent[]) {
  mockCreate.mockResolvedValueOnce({
    content: [{ type: "text", text: JSON.stringify({ chain: steps }) }],
  });
}

/** Mock API returning legacy single-action format */
function mockLegacyResponse(intent: ActionIntent) {
  mockCreate.mockResolvedValueOnce({
    content: [{ type: "text", text: JSON.stringify(intent) }],
  });
}

function mockApiTextResponse(text: string) {
  mockCreate.mockResolvedValueOnce({
    content: [{ type: "text", text }],
  });
}

// ---------------------------------------------------------------------------
// Classification Scenarios (backward-compatible single actions)
// ---------------------------------------------------------------------------

describe("interpretInstruction — single action (backward compat)", () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it("classifies 'update task X to done' as update_task_status", async () => {
    mockChainResponse([{
      action: "update_task_status",
      params: { taskQuery: "Setup types", newStatus: "done" },
      preview: 'Mark "Setup types" as done',
      confidence: 0.95,
    }]);

    const result = await interpretInstruction("mark Setup types as done", TEST_CONTEXT);

    expect(result.steps).toHaveLength(1);
    expect(result.steps[0].action).toBe("update_task_status");
    expect(result.steps[0].params.taskQuery).toBe("Setup types");
    expect(result.steps[0].params.newStatus).toBe("done");
    expect(result.steps[0].confidence).toBeGreaterThan(0.5);
  });

  it("classifies 'go to roadmap' as navigate", async () => {
    mockChainResponse([{
      action: "navigate",
      params: { page: "roadmap" },
      preview: "Navigate to roadmap",
      confidence: 0.92,
    }]);

    const result = await interpretInstruction("go to roadmap", TEST_CONTEXT);

    expect(result.steps).toHaveLength(1);
    expect(result.steps[0].action).toBe("navigate");
    expect(result.steps[0].params.page).toBe("roadmap");
  });

  it("classifies 'refresh' as refresh_project", async () => {
    mockChainResponse([{
      action: "refresh_project",
      params: {},
      preview: "Refresh project data",
      confidence: 0.88,
    }]);

    const result = await interpretInstruction("refresh", TEST_CONTEXT);

    expect(result.steps).toHaveLength(1);
    expect(result.steps[0].action).toBe("refresh_project");
    expect(result.steps[0].confidence).toBeGreaterThan(0.5);
  });

  it("classifies 'generate next sprint' as generate_sprint", async () => {
    mockChainResponse([{
      action: "generate_sprint",
      params: {},
      preview: "Generate the next sprint",
      confidence: 0.95,
    }]);

    const result = await interpretInstruction("generate next sprint", TEST_CONTEXT);

    expect(result.steps).toHaveLength(1);
    expect(result.steps[0].action).toBe("generate_sprint");
  });

  it("classifies ambiguous input as search", async () => {
    mockChainResponse([{
      action: "search",
      params: { query: "something vague" },
      preview: "Search for: something vague",
      confidence: 0.3,
    }]);

    const result = await interpretInstruction("something vague", TEST_CONTEXT);

    expect(result.steps).toHaveLength(1);
    expect(result.steps[0].action).toBe("search");
  });

  it("handles legacy single-action response format", async () => {
    mockLegacyResponse({
      action: "navigate",
      params: { page: "sprints" },
      preview: "Go to sprints",
      confidence: 0.9,
    });

    const result = await interpretInstruction("show sprints", TEST_CONTEXT);

    // Legacy format should be wrapped in a chain
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0].action).toBe("navigate");
    expect(result.id).toBeTruthy();
  });

  it("sends correct system prompt and user message to API", async () => {
    mockChainResponse([{
      action: "navigate",
      params: { page: "sprints" },
      preview: "Go to sprints",
      confidence: 0.9,
    }]);

    await interpretInstruction("show sprints", TEST_CONTEXT);

    expect(mockCreate).toHaveBeenCalledOnce();
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.model).toBe("claude-haiku-4-5-20251001");
    expect(callArgs.max_tokens).toBe(512);
    expect(callArgs.system).toContain("command interpreter");
    expect(callArgs.system).toContain("CHAIN DETECTION");
    expect(callArgs.messages[0].content).toContain("Kyro");
    expect(callArgs.messages[0].content).toContain("show sprints");
  });
});

// ---------------------------------------------------------------------------
// Multi-step chain scenarios
// ---------------------------------------------------------------------------

describe("interpretInstruction — multi-step chains", () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it("parses two-step chain: mark done and refresh", async () => {
    mockChainResponse([
      {
        action: "update_task_status",
        params: { taskQuery: "T3.2", newStatus: "done" },
        preview: "Mark T3.2 as done",
        confidence: 0.92,
      },
      {
        action: "refresh_project",
        params: {},
        preview: "Refresh project",
        confidence: 0.88,
      },
    ]);

    const result = await interpretInstruction(
      "mark T3.2 as done and refresh the project",
      TEST_CONTEXT,
    );

    expect(result.steps).toHaveLength(2);
    expect(result.steps[0].action).toBe("update_task_status");
    expect(result.steps[1].action).toBe("refresh_project");
  });

  it("parses three-step chain", async () => {
    mockChainResponse([
      { action: "navigate", params: { page: "sprints" }, preview: "Go to sprints", confidence: 0.9 },
      { action: "search", params: { query: "blocked" }, preview: "Search blocked", confidence: 0.85 },
      { action: "update_task_status", params: { taskQuery: "blocked task", newStatus: "pending" }, preview: "Unblock task", confidence: 0.8 },
    ]);

    const result = await interpretInstruction(
      "go to sprints, search for blocked tasks, then unblock them",
      TEST_CONTEXT,
    );

    expect(result.steps).toHaveLength(3);
    expect(result.steps[0].action).toBe("navigate");
    expect(result.steps[1].action).toBe("search");
    expect(result.steps[2].action).toBe("update_task_status");
  });
});

// ---------------------------------------------------------------------------
// Edge Cases
// ---------------------------------------------------------------------------

describe("interpretInstruction — edge cases", () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it("handles malformed API response gracefully", async () => {
    mockApiTextResponse("this is not json at all");

    const result = await interpretInstruction("do something", TEST_CONTEXT);

    // Should fallback to search when JSON parse fails
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0].action).toBe("search");
    expect(result.steps[0].params.query).toBe("do something");
    expect(result.steps[0].confidence).toBe(0.2);
  });

  it("handles unsupported action type in chain", async () => {
    mockApiTextResponse(
      JSON.stringify({
        chain: [
          { action: "delete_everything", params: {}, preview: "Delete all data", confidence: 0.99 },
        ],
      })
    );

    const result = await interpretInstruction("delete everything", TEST_CONTEXT);

    // Invalid action filtered → fallback to search
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0].action).toBe("search");
  });

  it("handles empty content block from API", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: "image", source: {} }],
    });

    const result = await interpretInstruction("test", TEST_CONTEXT);

    // Empty text → JSON parse fails → fallback to search
    expect(result.steps[0].action).toBe("search");
  });

  it("handles API error", async () => {
    mockCreate.mockRejectedValueOnce(new Error("API rate limited"));

    await expect(
      interpretInstruction("test", TEST_CONTEXT)
    ).rejects.toThrow("API rate limited");
  });

  it("handles Spanish input correctly", async () => {
    mockChainResponse([{
      action: "update_task_status",
      params: { taskQuery: "tarea", newStatus: "done" },
      preview: 'Marcar "tarea" como hecha',
      confidence: 0.85,
    }]);

    const result = await interpretInstruction("marca tarea como hecha", TEST_CONTEXT);

    expect(result.steps[0].action).toBe("update_task_status");
  });

  it("handles very long input without crashing", async () => {
    const longInput = "a".repeat(5000);
    mockChainResponse([{
      action: "search",
      params: { query: longInput.substring(0, 100) },
      preview: "Search for: " + longInput.substring(0, 50),
      confidence: 0.2,
    }]);

    const result = await interpretInstruction(longInput, TEST_CONTEXT);

    expect(result.steps[0].action).toBe("search");
    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it("includes project context in the message", async () => {
    mockChainResponse([{
      action: "search",
      params: { query: "test" },
      preview: "Search",
      confidence: 0.3,
    }]);

    await interpretInstruction("test", {
      ...TEST_CONTEXT,
      projectName: "CustomProject",
      taskSummary: "10 pending, 0 done",
    });

    const messageContent = mockCreate.mock.calls[0][0].messages[0].content;
    expect(messageContent).toContain("CustomProject");
    expect(messageContent).toContain("10 pending, 0 done");
  });
});

// ---------------------------------------------------------------------------
// validateChain unit tests
// ---------------------------------------------------------------------------

describe("validateChain", () => {
  it("wraps legacy single-action format in a chain", () => {
    const result = validateChain(
      { action: "navigate", params: { page: "sprints" }, preview: "Go", confidence: 0.9 },
      "test input"
    );
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0].action).toBe("navigate");
    expect(result.id).toBeTruthy();
  });

  it("enforces max 5 steps", () => {
    const steps = Array.from({ length: 8 }, (_, i) => ({
      action: "search",
      params: { query: `query-${i}` },
      preview: `Search ${i}`,
      confidence: 0.8,
    }));
    const result = validateChain({ chain: steps }, "test");
    expect(result.steps.length).toBeLessThanOrEqual(5);
  });

  it("deduplicates consecutive identical actions", () => {
    const step = {
      action: "refresh_project",
      params: {},
      preview: "Refresh",
      confidence: 0.9,
    };
    const result = validateChain({ chain: [step, step, step] }, "test");
    expect(result.steps).toHaveLength(1);
  });

  it("keeps non-consecutive duplicate actions", () => {
    const result = validateChain({
      chain: [
        { action: "navigate", params: { page: "sprints" }, preview: "Go", confidence: 0.9 },
        { action: "search", params: { query: "test" }, preview: "Search", confidence: 0.8 },
        { action: "navigate", params: { page: "findings" }, preview: "Go", confidence: 0.9 },
      ],
    }, "test");
    expect(result.steps).toHaveLength(3);
  });

  it("filters out invalid actions from chain", () => {
    const result = validateChain({
      chain: [
        { action: "navigate", params: { page: "sprints" }, preview: "Go", confidence: 0.9 },
        { action: "invalid_action", params: {}, preview: "Bad", confidence: 0.5 },
        { action: "search", params: { query: "test" }, preview: "Search", confidence: 0.8 },
      ],
    }, "test");
    expect(result.steps).toHaveLength(2);
    expect(result.steps[0].action).toBe("navigate");
    expect(result.steps[1].action).toBe("search");
  });

  it("returns fallback for null input", () => {
    const result = validateChain(null, "my query");
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0].action).toBe("search");
    expect(result.steps[0].params.query).toBe("my query");
  });

  it("returns fallback for empty chain array", () => {
    const result = validateChain({ chain: [] }, "my query");
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0].action).toBe("search");
  });

  it("handles missing preview and confidence gracefully", () => {
    const result = validateChain({
      chain: [{ action: "refresh_project", params: {} }],
    }, "test");
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0].preview).toBe("refresh_project");
    expect(result.steps[0].confidence).toBe(0.5);
  });
});

// ---------------------------------------------------------------------------
// API key validation
// ---------------------------------------------------------------------------

describe("interpretInstruction — API key", () => {
  it("throws when ANTHROPIC_API_KEY is missing", async () => {
    const original = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    try {
      await expect(
        interpretInstruction("test", TEST_CONTEXT)
      ).rejects.toThrow("ANTHROPIC_API_KEY");
    } finally {
      process.env.ANTHROPIC_API_KEY = original;
    }
  });
});
