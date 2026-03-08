import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ProjectContext, ActionIntent } from "../interpret";

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
const { interpretInstruction } = await import("../interpret");

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

function mockApiResponse(intent: ActionIntent) {
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
// Classification Scenarios (T4.1 + T4.2)
// ---------------------------------------------------------------------------

describe("interpretInstruction — classification", () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it("classifies 'update task X to done' as update_task_status", async () => {
    const expected: ActionIntent = {
      action: "update_task_status",
      params: { taskQuery: "Setup types", newStatus: "done" },
      preview: 'Mark "Setup types" as done',
      confidence: 0.95,
    };
    mockApiResponse(expected);

    const result = await interpretInstruction("mark Setup types as done", TEST_CONTEXT);

    expect(result.action).toBe("update_task_status");
    expect(result.params.taskQuery).toBe("Setup types");
    expect(result.params.newStatus).toBe("done");
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it("classifies 'go to roadmap' as navigate", async () => {
    const expected: ActionIntent = {
      action: "navigate",
      params: { page: "roadmap" },
      preview: "Navigate to roadmap",
      confidence: 0.92,
    };
    mockApiResponse(expected);

    const result = await interpretInstruction("go to roadmap", TEST_CONTEXT);

    expect(result.action).toBe("navigate");
    expect(result.params.page).toBe("roadmap");
  });

  it("classifies 'refresh' as refresh_project", async () => {
    const expected: ActionIntent = {
      action: "refresh_project",
      params: {},
      preview: "Refresh project data",
      confidence: 0.88,
    };
    mockApiResponse(expected);

    const result = await interpretInstruction("refresh", TEST_CONTEXT);

    expect(result.action).toBe("refresh_project");
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it("classifies 'generate next sprint' as generate_sprint", async () => {
    const expected: ActionIntent = {
      action: "generate_sprint",
      params: {},
      preview: "Generate the next sprint",
      confidence: 0.95,
    };
    mockApiResponse(expected);

    const result = await interpretInstruction("generate next sprint", TEST_CONTEXT);

    expect(result.action).toBe("generate_sprint");
  });

  it("classifies ambiguous input as search", async () => {
    const expected: ActionIntent = {
      action: "search",
      params: { query: "something vague" },
      preview: "Search for: something vague",
      confidence: 0.3,
    };
    mockApiResponse(expected);

    const result = await interpretInstruction("something vague", TEST_CONTEXT);

    expect(result.action).toBe("search");
  });

  it("sends correct system prompt and user message to API", async () => {
    mockApiResponse({
      action: "navigate",
      params: { page: "sprints" },
      preview: "Go to sprints",
      confidence: 0.9,
    });

    await interpretInstruction("show sprints", TEST_CONTEXT);

    expect(mockCreate).toHaveBeenCalledOnce();
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.model).toBe("claude-haiku-4-5-20251001");
    expect(callArgs.max_tokens).toBe(256);
    expect(callArgs.system).toContain("command interpreter");
    expect(callArgs.messages[0].content).toContain("Kyro");
    expect(callArgs.messages[0].content).toContain("show sprints");
  });
});

// ---------------------------------------------------------------------------
// Edge Cases (T4.3)
// ---------------------------------------------------------------------------

describe("interpretInstruction — edge cases", () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it("handles malformed API response gracefully", async () => {
    mockApiTextResponse("this is not json at all");

    const result = await interpretInstruction("do something", TEST_CONTEXT);

    // Should fallback to search when JSON parse fails
    expect(result.action).toBe("search");
    expect(result.params.query).toBe("do something");
    expect(result.confidence).toBe(0.2);
  });

  it("handles unsupported action type", async () => {
    mockApiTextResponse(
      JSON.stringify({
        action: "delete_everything",
        params: {},
        preview: "Delete all data",
        confidence: 0.99,
      })
    );

    const result = await interpretInstruction("delete everything", TEST_CONTEXT);

    // Should fallback to search for unknown actions
    expect(result.action).toBe("search");
    expect(result.confidence).toBe(0.3);
  });

  it("handles empty content block from API", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: "image", source: {} }],
    });

    const result = await interpretInstruction("test", TEST_CONTEXT);

    // Empty text → JSON parse fails → fallback to search
    expect(result.action).toBe("search");
  });

  it("handles API error", async () => {
    mockCreate.mockRejectedValueOnce(new Error("API rate limited"));

    await expect(
      interpretInstruction("test", TEST_CONTEXT)
    ).rejects.toThrow("API rate limited");
  });

  it("handles Spanish input correctly", async () => {
    const expected: ActionIntent = {
      action: "update_task_status",
      params: { taskQuery: "tarea", newStatus: "done" },
      preview: 'Marcar "tarea" como hecha',
      confidence: 0.85,
    };
    mockApiResponse(expected);

    const result = await interpretInstruction(
      "marca tarea como hecha",
      TEST_CONTEXT
    );

    expect(result.action).toBe("update_task_status");
  });

  it("handles very long input without crashing", async () => {
    const longInput = "a".repeat(5000);
    mockApiResponse({
      action: "search",
      params: { query: longInput.substring(0, 100) },
      preview: "Search for: " + longInput.substring(0, 50),
      confidence: 0.2,
    });

    const result = await interpretInstruction(longInput, TEST_CONTEXT);

    expect(result.action).toBe("search");
    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it("includes project context in the message", async () => {
    mockApiResponse({
      action: "search",
      params: { query: "test" },
      preview: "Search",
      confidence: 0.3,
    });

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
// API key validation (T4.1)
// ---------------------------------------------------------------------------

describe("interpretInstruction — API key", () => {
  it("throws when ANTHROPIC_API_KEY is missing", async () => {
    // Temporarily unset the key
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
