import Anthropic from "@anthropic-ai/sdk";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SupportedAction =
  | "update_task_status"
  | "generate_sprint"
  | "refresh_project"
  | "navigate"
  | "search";

const VALID_ACTIONS: SupportedAction[] = [
  "update_task_status",
  "generate_sprint",
  "refresh_project",
  "navigate",
  "search",
];

const MAX_CHAIN_STEPS = 5;

export interface ActionIntent {
  action: SupportedAction;
  params: Record<string, string>;
  preview: string;
  confidence: number;
}

export interface ActionChain {
  id: string;
  steps: ActionIntent[];
}

export type ChainStepStatus =
  | "pending"
  | "executing"
  | "done"
  | "failed"
  | "cancelled"
  | "confirm";

export interface ChainStepResult {
  success: boolean;
  error?: string;
}

export interface ChainExecutionState {
  chain: ActionChain;
  currentStep: number;
  results: Record<number, ChainStepResult>;
  status: "preview" | "executing" | "paused" | "completed" | "cancelled";
}

export interface ProjectContext {
  projectName: string;
  projectId: string;
  sprintNames: string[];
  taskSummary: string; // e.g. "12 pending, 3 in_progress, 8 done"
  hasRoadmap: boolean;
  hasPendingSprints: boolean;
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a command interpreter for Kyro, a sprint management tool. Your job is to understand the user's natural language instruction and classify it into one or more supported actions.

Supported actions:
1. "update_task_status" — User wants to change a task's status. Params: { taskQuery: "<search term>", newStatus: "pending|in_progress|done|blocked|skipped|carry_over" }
2. "generate_sprint" — User wants to generate the next sprint. Params: {}
3. "refresh_project" — User wants to reload project data from disk. Params: {}
4. "navigate" — User wants to go to a page. Params: { page: "overview|sprints|findings|roadmap|debt|documents|agents" }
5. "search" — User wants to search for something. Params: { query: "<search term>" }

CHAIN DETECTION:
- If the instruction contains multiple actions (connected by "and", "then", "after that", commas, or sequential phrasing), return ALL actions as an ordered array in the "chain" field.
- If the instruction is a single action, still return it as a chain with one element.
- Maximum ${MAX_CHAIN_STEPS} actions per chain. If more are detected, keep only the first ${MAX_CHAIN_STEPS}.

Examples:
- "mark T3.2 as done" → single action chain
- "mark T3.2 as done and refresh the project" → two-action chain
- "go to sprints, then search for blocked tasks" → two-action chain
- "mark T1.1 done, mark T1.2 done, and generate the next sprint" → three-action chain

Respond with ONLY valid JSON matching this schema:
{
  "chain": [
    { "action": "<action_name>", "params": { ... }, "preview": "<human-readable description>", "confidence": <0.0 to 1.0> },
    ...
  ]
}

If you cannot determine the action, respond with:
{
  "chain": [
    { "action": "search", "params": { "query": "<user's input>" }, "preview": "Search for: <user's input>", "confidence": 0.3 }
  ]
}

Do NOT include any text outside the JSON object.`;

// ---------------------------------------------------------------------------
// Chain validation
// ---------------------------------------------------------------------------

export function validateChain(raw: unknown, fallbackInput: string): ActionChain {
  const fallback: ActionChain = {
    id: generateChainId(),
    steps: [
      {
        action: "search",
        params: { query: fallbackInput },
        preview: `Search for: ${fallbackInput}`,
        confidence: 0.2,
      },
    ],
  };

  if (!raw || typeof raw !== "object") return fallback;

  const obj = raw as Record<string, unknown>;

  // Handle chain array format
  let steps: unknown[];
  if (Array.isArray(obj.chain)) {
    steps = obj.chain;
  } else if (obj.action && typeof obj.action === "string") {
    // Legacy single-action format — wrap in chain
    steps = [obj];
  } else {
    return fallback;
  }

  if (steps.length === 0) return fallback;

  // Validate and filter steps
  const validSteps: ActionIntent[] = [];
  for (const step of steps) {
    if (validSteps.length >= MAX_CHAIN_STEPS) break;
    if (!step || typeof step !== "object") continue;

    const s = step as Record<string, unknown>;
    if (typeof s.action !== "string" || !VALID_ACTIONS.includes(s.action as SupportedAction)) {
      continue;
    }

    validSteps.push({
      action: s.action as SupportedAction,
      params: (typeof s.params === "object" && s.params !== null
        ? s.params
        : {}) as Record<string, string>,
      preview: typeof s.preview === "string" ? s.preview : `${s.action}`,
      confidence: typeof s.confidence === "number" ? s.confidence : 0.5,
    });
  }

  if (validSteps.length === 0) return fallback;

  // Deduplicate consecutive identical actions
  const deduped: ActionIntent[] = [validSteps[0]];
  for (let i = 1; i < validSteps.length; i++) {
    const prev = validSteps[i - 1];
    const curr = validSteps[i];
    if (
      prev.action === curr.action &&
      JSON.stringify(prev.params) === JSON.stringify(curr.params)
    ) {
      continue;
    }
    deduped.push(curr);
  }

  return { id: generateChainId(), steps: deduped };
}

function generateChainId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return `chain-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ---------------------------------------------------------------------------
// Interpreter
// ---------------------------------------------------------------------------

export async function interpretInstruction(
  input: string,
  context: ProjectContext,
): Promise<ActionChain> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const client = new Anthropic({ apiKey });

  const contextBlock = [
    `Project: ${context.projectName} (${context.projectId})`,
    `Sprints: ${context.sprintNames.join(", ") || "none"}`,
    `Tasks: ${context.taskSummary}`,
    `Roadmap: ${context.hasRoadmap ? "available" : "none"}`,
    `Pending sprints: ${context.hasPendingSprints ? "yes" : "no"}`,
  ].join("\n");

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Project context:\n${contextBlock}\n\nUser instruction: "${input}"`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const parsed = JSON.parse(text);
    return validateChain(parsed, input);
  } catch {
    return validateChain(null, input);
  }
}
