import matter from "gray-matter";
import type {
  Workspace,
  Project,
  Sprint,
  Task,
  Document,
  TeamMember,
  AgentActivity,
} from "@/lib/types";
import { symbolToStatus } from "@/lib/types";

// gray-matter can parse YAML dates as JS Date objects.
// This helper normalizes a field value to string, preserving date-only format.
function dateStr(value: unknown): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date) {
    // Return YYYY-MM-DD if there's no time component, else full ISO
    const iso = value.toISOString();
    return iso.endsWith("T00:00:00.000Z") ? iso.split("T")[0] : iso;
  }
  return String(value);
}

// ---------------------------------------------------------------------------
// Workspace Config  (.kyro/config.json)
// ---------------------------------------------------------------------------

export function parseWorkspaceConfig(
  json: string,
  rootPath: string
): Omit<Workspace, "projects" | "members"> {
  const raw = JSON.parse(json) as {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
  };
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    rootPath,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

// ---------------------------------------------------------------------------
// Team Members  (.kyro/members.json)
// ---------------------------------------------------------------------------

export function parseMembersFile(json: string): TeamMember[] {
  const raw = JSON.parse(json) as TeamMember[];
  return raw;
}

// ---------------------------------------------------------------------------
// Agent Activities  (.kyro/activities.json)
// ---------------------------------------------------------------------------

export function parseActivitiesFile(json: string): AgentActivity[] {
  if (!json.trim()) return [];
  const raw = JSON.parse(json) as AgentActivity[];
  return raw;
}

// ---------------------------------------------------------------------------
// Document File  (projects/{slug}/documents/{slug}.md)
// ---------------------------------------------------------------------------

export function parseDocumentFile(content: string, fallbackId: string): Document {
  const { data, content: body } = matter(content);
  return {
    id: (data.id as string | undefined) ?? fallbackId,
    title: (data.title as string | undefined) ?? "Untitled Document",
    content: body.trim(),
    createdAt: (data.createdAt as string | undefined) ?? new Date().toISOString(),
    updatedAt: (data.updatedAt as string | undefined) ?? new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Sprint File  (projects/{slug}/sprints/SPRINT-NN.md)
// ---------------------------------------------------------------------------

// Matches lines like: - [x] Task description
// Captures symbol (char inside []) and the rest of the line.
const TASK_LINE_RE = /^- \[(.)\] (.+)$/;

// Matches phase headings like: ### Phase 1: Name  or  ### Fase 1 — Name
const PHASE_HEADING_RE = /^#{2,4}\s+(Phase|Fase)\s+\d+/i;

interface RawSprintTask {
  symbol: string;
  title: string;
  phase: string;
}

function extractTasksFromBody(body: string): RawSprintTask[] {
  const lines = body.split("\n");
  const tasks: RawSprintTask[] = [];
  let currentPhase = "General";

  for (const line of lines) {
    if (PHASE_HEADING_RE.test(line.trim())) {
      // Extract phase name: everything after the "Phase N:" or "Fase N —"
      currentPhase = line.replace(/^#{2,4}\s+/, "").trim();
    }
    const match = TASK_LINE_RE.exec(line.trim());
    if (match) {
      tasks.push({
        symbol: match[1],
        title: match[2].trim(),
        phase: currentPhase,
      });
    }
  }
  return tasks;
}

export function parseSprintFile(content: string): Sprint {
  const { data, content: body } = matter(content);

  const rawTasks = extractTasksFromBody(body);
  const tasks: Task[] = rawTasks.map((raw, index) => ({
    id: `${(data.id as string | undefined) ?? "sprint"}-task-${index}`,
    title: raw.title,
    description: undefined,
    priority: "medium",
    status: symbolToStatus(raw.symbol),
    tags: [],
    createdAt: (data.startDate as string | undefined) ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  return {
    id: (data.id as string | undefined) ?? "sprint-unknown",
    name: (data.name as string | undefined) ?? "Sprint",
    status: ((data.status as string | undefined) ?? "planned") as Sprint["status"],
    startDate: dateStr(data.startDate),
    endDate: dateStr(data.endDate),
    version: data.version as string | undefined,
    objective: data.objective as string | undefined,
    tasks,
    sections: undefined,
  };
}

// ---------------------------------------------------------------------------
// Project README  (projects/{slug}/README.md)
// ---------------------------------------------------------------------------

export function parseProjectReadme(
  content: string,
  slug: string
): Pick<Project, "id" | "name" | "description" | "readme" | "createdAt" | "updatedAt"> {
  const { data, content: body } = matter(content);
  return {
    id: (data.id as string | undefined) ?? slug,
    name: (data.name as string | undefined) ?? slug,
    description: (data.description as string | undefined) ?? "",
    readme: body.trim(),
    createdAt: (data.createdAt as string | undefined) ?? new Date().toISOString(),
    updatedAt: (data.updatedAt as string | undefined) ?? new Date().toISOString(),
  };
}
