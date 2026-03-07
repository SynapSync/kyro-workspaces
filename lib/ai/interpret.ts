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

export interface ActionIntent {
  action: SupportedAction;
  params: Record<string, string>;
  preview: string;
  confidence: number;
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

const SYSTEM_PROMPT = `You are a command interpreter for Kyro, a sprint management tool. Your job is to understand the user's natural language instruction and classify it into one of the supported actions.

Supported actions:
1. "update_task_status" — User wants to change a task's status. Params: { taskQuery: "<search term>", newStatus: "pending|in_progress|done|blocked|skipped|carry_over" }
2. "generate_sprint" — User wants to generate the next sprint. Params: {}
3. "refresh_project" — User wants to reload project data from disk. Params: {}
4. "navigate" — User wants to go to a page. Params: { page: "overview|sprints|findings|roadmap|debt|documents|agents" }
5. "search" — User wants to search for something. Params: { query: "<search term>" }

Respond with ONLY valid JSON matching this schema:
{
  "action": "<action_name>",
  "params": { ... },
  "preview": "<human-readable description of what will happen>",
  "confidence": <0.0 to 1.0>
}

If you cannot determine the action, respond with:
{
  "action": "search",
  "params": { "query": "<user's input>" },
  "preview": "Search for: <user's input>",
  "confidence": 0.3
}

Do NOT include any text outside the JSON object.`;

// ---------------------------------------------------------------------------
// Interpreter
// ---------------------------------------------------------------------------

export async function interpretInstruction(
  input: string,
  context: ProjectContext,
): Promise<ActionIntent> {
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
    max_tokens: 256,
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
    const parsed = JSON.parse(text) as ActionIntent;
    // Validate action is supported
    const validActions: SupportedAction[] = [
      "update_task_status",
      "generate_sprint",
      "refresh_project",
      "navigate",
      "search",
    ];
    if (!validActions.includes(parsed.action)) {
      return {
        action: "search",
        params: { query: input },
        preview: `Search for: ${input}`,
        confidence: 0.3,
      };
    }
    return parsed;
  } catch {
    return {
      action: "search",
      params: { query: input },
      preview: `Search for: ${input}`,
      confidence: 0.2,
    };
  }
}
