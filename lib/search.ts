"use client";

import { useMemo } from "react";
import type { Project, Finding } from "./types";

// --- Search Entry Types ---

export type SearchEntryType =
  | "sprint"
  | "task"
  | "finding"
  | "debt"
  | "document"
  | "phase";

export interface SearchEntry {
  type: SearchEntryType;
  title: string;
  description: string;
  metadata: Record<string, string>;
  projectId: string;
  projectName: string;
  navigateTo: string;
}

// --- Search Index Builder ---

export function buildSearchIndex(
  projects: Project[],
  findings: Record<string, Finding[]>
): SearchEntry[] {
  const entries: SearchEntry[] = [];

  for (const project of projects) {
    const pid = project.id;
    const pname = project.name;

    // Sprints
    for (const sprint of project.sprints) {
      entries.push({
        type: "sprint",
        title: sprint.name,
        description: sprint.objective ?? "",
        metadata: {
          status: sprint.status,
          ...(sprint.sprintType ? { sprintType: sprint.sprintType } : {}),
          ...(sprint.version ? { version: sprint.version } : {}),
        },
        projectId: pid,
        projectName: pname,
        navigateTo: `/${pid}/sprints/${sprint.id}/detail`,
      });

      // Tasks from sprint
      for (const task of sprint.tasks) {
        entries.push({
          type: "task",
          title: task.title,
          description: task.description ?? "",
          metadata: {
            status: task.status,
            priority: task.priority,
            ...(task.taskRef ? { taskRef: task.taskRef } : {}),
          },
          projectId: pid,
          projectName: pname,
          navigateTo: `/${pid}/sprints/${sprint.id}/detail`,
        });
      }

      // Phases from sprint
      if (sprint.phases) {
        for (const phase of sprint.phases) {
          entries.push({
            type: "phase",
            title: phase.name,
            description: phase.objective,
            metadata: {
              sprint: sprint.name,
              ...(phase.isEmergent ? { emergent: "true" } : {}),
            },
            projectId: pid,
            projectName: pname,
            navigateTo: `/${pid}/sprints/${sprint.id}/detail`,
          });
        }
      }

      // Debt items from sprint
      if (sprint.debtItems) {
        for (const debt of sprint.debtItems) {
          entries.push({
            type: "debt",
            title: `D${debt.number}: ${debt.item}`,
            description: `Origin: ${debt.origin}`,
            metadata: {
              status: debt.status,
              target: debt.sprintTarget,
              ...(debt.resolvedIn ? { resolvedIn: debt.resolvedIn } : {}),
            },
            projectId: pid,
            projectName: pname,
            navigateTo: `/${pid}/debt`,
          });
        }
      }
    }

    // Documents
    for (const doc of project.documents) {
      entries.push({
        type: "document",
        title: doc.title,
        description: doc.content.slice(0, 200),
        metadata: {},
        projectId: pid,
        projectName: pname,
        navigateTo: `/${pid}/documents`,
      });
    }

    // Findings (per-project, from separate store slice)
    const projectFindings = findings[pid] ?? [];
    for (const finding of projectFindings) {
      entries.push({
        type: "finding",
        title: `#${String(finding.number).padStart(2, "0")} ${finding.title}`,
        description: finding.summary,
        metadata: {
          severity: finding.severity,
          files: String(finding.affectedFiles.length),
        },
        projectId: pid,
        projectName: pname,
        navigateTo: `/${pid}/findings?finding=${finding.id}`,
      });
    }
  }

  return entries;
}

// --- Deduplication for debt items ---
// Debt items appear in every sprint; keep only the latest version (last sprint wins)

export function deduplicateDebtEntries(entries: SearchEntry[]): SearchEntry[] {
  const debtMap = new Map<string, SearchEntry>();
  const nonDebt: SearchEntry[] = [];

  for (const entry of entries) {
    if (entry.type === "debt") {
      // Use the D-number as key (e.g., "D1", "D17")
      const match = entry.title.match(/^D(\d+):/);
      if (match) {
        debtMap.set(match[1], entry); // last write wins
      } else {
        nonDebt.push(entry);
      }
    } else {
      nonDebt.push(entry);
    }
  }

  return [...nonDebt, ...debtMap.values()];
}

// --- Grouping ---

export function groupByType(
  entries: SearchEntry[]
): Record<SearchEntryType, SearchEntry[]> {
  const groups: Record<SearchEntryType, SearchEntry[]> = {
    sprint: [],
    task: [],
    finding: [],
    debt: [],
    document: [],
    phase: [],
  };
  for (const entry of entries) {
    groups[entry.type].push(entry);
  }
  return groups;
}

// --- Hook ---

export function useSearchIndex(
  projects: Project[],
  findings: Record<string, Finding[]>
): SearchEntry[] {
  return useMemo(() => {
    const raw = buildSearchIndex(projects, findings);
    return deduplicateDebtEntries(raw);
  }, [projects, findings]);
}
