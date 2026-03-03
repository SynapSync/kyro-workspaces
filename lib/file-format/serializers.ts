import matter from "gray-matter";
import type { Workspace, Sprint, Task, Document, TeamMember, AgentActivity } from "@/lib/types";
import { STATUS_TO_SYMBOL } from "@/lib/types";

// ---------------------------------------------------------------------------
// Workspace Config  (.kyro/config.json)
// ---------------------------------------------------------------------------

export function serializeWorkspaceConfig(
  workspace: Omit<Workspace, "projects" | "members">
): string {
  const { id, name, description, createdAt, updatedAt } = workspace;
  return JSON.stringify({ id, name, description, createdAt, updatedAt }, null, 2);
}

// ---------------------------------------------------------------------------
// Team Members  (.kyro/members.json)
// ---------------------------------------------------------------------------

export function serializeMembersFile(members: TeamMember[]): string {
  return JSON.stringify(members, null, 2);
}

// ---------------------------------------------------------------------------
// Agent Activities  (.kyro/activities.json)
// ---------------------------------------------------------------------------

export function serializeActivitiesFile(activities: AgentActivity[]): string {
  return JSON.stringify(activities, null, 2);
}

// ---------------------------------------------------------------------------
// Document File  (projects/{slug}/documents/{slug}.md)
// ---------------------------------------------------------------------------

export function serializeDocumentFile(doc: Document): string {
  return matter.stringify(doc.content, {
    id: doc.id,
    title: doc.title,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  });
}

// ---------------------------------------------------------------------------
// Sprint File  (projects/{slug}/sprints/SPRINT-NN.md)
// ---------------------------------------------------------------------------

function taskToSymbol(task: Task): string {
  const symbol = STATUS_TO_SYMBOL[task.status] ?? " ";
  return `- [${symbol}] ${task.title}`;
}

function phaseFromTask(task: Task): string {
  const description = task.description?.trim();
  if (!description) return "General";

  const match = description.match(/^\[phase:(.+?)\]/i);
  if (!match) return "General";

  return match[1].trim() || "General";
}

export function serializeSprintFile(sprint: Sprint): string {
  const grouped = new Map<string, string[]>();
  for (const task of sprint.tasks) {
    const phase = phaseFromTask(task);
    const existing = grouped.get(phase) ?? [];
    existing.push(taskToSymbol(task));
    grouped.set(phase, existing);
  }

  const taskBlocks =
    grouped.size > 0
      ? [...grouped.entries()]
          .map(([phase, lines]) => `### ${phase}\n${lines.join("\n")}`)
          .join("\n\n")
      : "_(sin tareas aún)_";

  const body = `# ${sprint.name}

## Objetivo
${sprint.objective ?? ""}

## Tareas
${taskBlocks}

## Retrospectiva

### Qué funcionó bien

### Qué no funcionó

### Deuda técnica nueva

### Recomendaciones para el próximo sprint
`;

  return matter.stringify(body, {
    id: sprint.id,
    name: sprint.name,
    status: sprint.status,
    ...(sprint.startDate ? { startDate: sprint.startDate } : {}),
    ...(sprint.endDate ? { endDate: sprint.endDate } : {}),
    ...(sprint.version ? { version: sprint.version } : {}),
    ...(sprint.objective ? { objective: sprint.objective } : {}),
  });
}

// ---------------------------------------------------------------------------
// Project README  (projects/{slug}/README.md)
// ---------------------------------------------------------------------------

export function serializeProjectReadme(project: {
  id: string;
  name: string;
  description: string;
  readme: string;
  createdAt: string;
  updatedAt: string;
}): string {
  return matter.stringify(project.readme, {
    id: project.id,
    name: project.name,
    description: project.description,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  });
}
