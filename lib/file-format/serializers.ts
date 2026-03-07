import matter from "gray-matter";
import type { Workspace, Document, TeamMember, AgentActivity, SprintTaskSymbol } from "@/lib/types";
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
// Sprint File — Surgical Patch for Task Status Updates
// ---------------------------------------------------------------------------
// Instead of rewriting the entire sprint file (which would destroy sprint-forge
// structure), this function performs a targeted find-replace on the checkbox
// symbol for a specific task line.

/**
 * Patches a single task's checkbox status in raw sprint markdown content.
 *
 * Matches lines like:
 *   - [x] **T1.1**: Task title here
 *   - [ ] Task title here
 *   - [~] **TE.2**: Another task
 *
 * @param content  Raw markdown string of the sprint file
 * @param taskTitle  The task title to search for (matched as substring)
 * @param newStatus  The TaskStatus to set
 * @returns The patched content, or the original content if no match found
 */
export function patchTaskStatusInMarkdown(
  content: string,
  taskTitle: string,
  newStatus: string,
): string {
  const newSymbol: SprintTaskSymbol = STATUS_TO_SYMBOL[newStatus as keyof typeof STATUS_TO_SYMBOL] ?? STATUS_TO_SYMBOL.pending;

  // Escape special regex characters in the task title
  const escaped = taskTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Match: - [any_single_char] optional_bold_task_ref task_title
  // The checkbox is always a single character between [ and ]
  const pattern = new RegExp(
    `^(\\s*- \\[)[^\\]](\\]\\s+(?:\\*\\*\\w[\\w.]*\\*\\*:\\s*)?${escaped})`,
    "m",
  );

  const match = content.match(pattern);
  if (!match) return content;

  return content.replace(pattern, `$1${newSymbol}$2`);
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
