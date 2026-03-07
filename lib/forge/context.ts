import type { Project, Finding, RoadmapSprintEntry, DebtItem, Sprint } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NextSprintInfo {
  number: number;
  sprintId: string;
  version: string;
  type: string;
  focus: string;
  findingSource: string;
  dependencies: string[];
}

export interface SprintForgeContext {
  projectName: string;
  projectId: string;
  projectPath: string;

  lastSprint: {
    number: number;
    name: string;
    id: string;
  } | null;

  nextSprint: NextSprintInfo | null;

  openDebtItems: DebtItem[];
  allFindings: Finding[];
  completedSprintCount: number;
  totalSprintCount: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Finds the first non-completed sprint in the roadmap.
 * Returns null if all sprints are completed or roadmap is empty.
 */
export function getNextSprintInfo(
  roadmapSprints: RoadmapSprintEntry[],
): NextSprintInfo | null {
  const next = roadmapSprints.find((s) => s.status !== "completed");
  if (!next) return null;

  return {
    number: next.number,
    sprintId: next.sprintId,
    version: next.version,
    type: next.type,
    focus: next.focus,
    findingSource: next.findingSource,
    dependencies: next.dependencies,
  };
}

/**
 * Extracts open debt items from the last sprint's parsed data.
 * Falls back to empty array if no sprint has debt items.
 */
function extractOpenDebt(sprints: Sprint[]): DebtItem[] {
  // Find the last sprint that has debt items
  for (let i = sprints.length - 1; i >= 0; i--) {
    const s = sprints[i];
    if (s.debtItems && s.debtItems.length > 0) {
      return s.debtItems.filter(
        (d) => d.status === "open" || d.status === "in-progress",
      );
    }
  }
  return [];
}

/**
 * Gets the last completed sprint from the project's sprint list.
 */
function getLastSprint(sprints: Sprint[]): { number: number; name: string; id: string } | null {
  if (sprints.length === 0) return null;

  // Sprints are typically sorted by name/number. Take the last one.
  const last = sprints[sprints.length - 1];

  // Extract sprint number from name (e.g., "Sprint 8 — ...")
  const match = last.name.match(/Sprint\s+(\d+)/i);
  const number = match ? parseInt(match[1], 10) : sprints.length;

  return {
    number,
    name: last.name,
    id: last.id,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * Assembles the full context needed to compose a sprint-forge prompt.
 * Pure function — no side effects, no API calls.
 */
export function assembleSprintContext(
  project: Project,
  findings: Finding[],
  roadmapSprints: RoadmapSprintEntry[],
): SprintForgeContext {
  const lastSprint = getLastSprint(project.sprints);
  const nextSprint = getNextSprintInfo(roadmapSprints);
  const openDebtItems = extractOpenDebt(project.sprints);

  const completedCount = roadmapSprints.filter(
    (s) => s.status === "completed",
  ).length;

  return {
    projectName: project.name,
    projectId: project.id,
    projectPath: project.id, // The ID is derived from the directory path

    lastSprint,
    nextSprint,

    openDebtItems,
    allFindings: findings,
    completedSprintCount: completedCount,
    totalSprintCount: roadmapSprints.length,
  };
}
