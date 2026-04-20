import matter from "gray-matter";
import type { Workspace, Document, TeamMember, AgentActivity } from "@/lib/types";

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
