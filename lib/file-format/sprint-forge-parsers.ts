/**
 * Parsers for sprint-forge output files:
 * - Sprint files (blockquote metadata, phases, rich tasks)
 * - Finding files
 * - Roadmap sprint summary
 * - Sprint-forge README
 */

import { symbolToStatus } from "@/lib/types";
import type {
  Task,
  Phase,
  DebtItem,
  DispositionEntry,
  FindingsConsolidationEntry,
  Sprint,
  Finding,
  FindingSeverity,
  RoadmapSprintEntry,
  SprintType,
} from "@/lib/types";
import {
  extractSections,
  extractBlockquoteMetadata,
  extractHeadingTitle,
  parseMarkdownTable,
  extractChecklistItems,
} from "./markdown-utils";

// ---------------------------------------------------------------------------
// Format Detection
// ---------------------------------------------------------------------------

export function detectSprintFormat(
  content: string
): "frontmatter" | "sprint-forge" {
  const trimmed = content.trimStart();
  if (trimmed.startsWith("---")) {
    return "frontmatter";
  }
  return "sprint-forge";
}

// ---------------------------------------------------------------------------
// Sprint Metadata
// ---------------------------------------------------------------------------

export function parseSprintForgeMetadata(content: string): {
  id: string;
  name: string;
  status: "planned" | "active" | "closed";
  sprintType?: SprintType;
  version?: string;
  source?: string;
  previousSprint?: string;
  carryOverCount?: number;
  executionDate?: string;
  executedBy?: string;
  objective?: string;
} {
  const heading = extractHeadingTitle(content);
  const meta = extractBlockquoteMetadata(content);

  const sprintNumber = heading?.number ?? 0;
  const title = heading?.title ?? "Sprint";

  // Determine status from execution date
  let status: "planned" | "active" | "closed" = "planned";
  if (meta["Execution Date"] && meta["Execution Date"] !== "—") {
    status = "closed";
  }

  // Extract carry-over count
  let carryOverCount: number | undefined;
  const carryOverMatch = /^(\d+)/.exec(meta["Carry-over"] ?? "");
  if (carryOverMatch) {
    carryOverCount = parseInt(carryOverMatch[1], 10);
  }

  // Extract objective from sections
  const sections = extractSections(content);
  const objective = sections["Sprint Objective"]?.trim();

  return {
    id: `sprint-${sprintNumber}`,
    name: `Sprint ${sprintNumber} — ${title}`,
    status,
    sprintType: parseSprintType(meta["Type"]),
    version: meta["Version Target"],
    source: meta["Source"]?.replace(/`/g, ""),
    previousSprint: parsePreviousSprint(meta["Previous Sprint"]),
    carryOverCount,
    executionDate:
      meta["Execution Date"] !== "—"
        ? meta["Execution Date"]
        : undefined,
    executedBy:
      meta["Executed By"] !== "—" ? meta["Executed By"] : undefined,
    objective,
  };
}

function parseSprintType(raw?: string): SprintType | undefined {
  if (!raw) return undefined;
  const normalized = raw.toLowerCase().trim();
  const valid = ["audit", "refactor", "feature", "bugfix", "debt"];
  return valid.includes(normalized)
    ? (normalized as SprintType)
    : undefined;
}

function parsePreviousSprint(raw?: string): string | undefined {
  if (!raw || raw === "None" || raw === "—") return undefined;
  return raw.replace(/`/g, "").trim();
}

// ---------------------------------------------------------------------------
// Rich Task Parser
// ---------------------------------------------------------------------------

const TASK_RE =
  /^-\s+\[(.)\]\s+\*\*([^*]+)\*\*:\s*(.+)$/;
const SUB_ITEM_RE = /^\s+-\s+(\w+):\s*(.+)$/;

export function parseSprintForgeTasks(phaseBody: string): Task[] {
  const lines = phaseBody.split("\n");
  const tasks: Task[] = [];
  let current: Partial<Task> | null = null;

  for (const line of lines) {
    const taskMatch = TASK_RE.exec(line.trim());
    if (taskMatch) {
      if (current) {
        tasks.push(current as Task);
      }
      const symbol = taskMatch[1];
      const taskRef = taskMatch[2].trim();
      const title = taskMatch[3].trim();

      current = {
        id: taskRef.toLowerCase().replace(/\./g, "-"),
        title,
        taskRef,
        status: symbolToStatus(symbol),
        priority: "medium",
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      continue;
    }

    // Check for sub-items on the current task
    if (current) {
      const subMatch = SUB_ITEM_RE.exec(line);
      if (subMatch) {
        const key = subMatch[1].toLowerCase();
        const value = subMatch[2].trim().replace(/`/g, "");
        if (key === "files") {
          current.files = value
            .split(",")
            .map((f) => f.trim())
            .filter(Boolean);
        } else if (key === "evidence") {
          current.evidence = value;
        } else if (key === "verification") {
          current.verification = value;
        }
      }
    }
  }

  if (current) {
    tasks.push(current as Task);
  }

  return tasks;
}

// ---------------------------------------------------------------------------
// Phase Parser
// ---------------------------------------------------------------------------

const PHASE_RE =
  /^###\s+(Phase\s+\d+|Emergent\s+Phase)\s*[—–-]\s*(.+)$/i;
const OBJECTIVE_RE = /^\*\*Objective\*\*:\s*(.+)$/;

export function parsePhases(phasesContent: string): Phase[] {
  const lines = phasesContent.split("\n");
  const phases: Phase[] = [];
  let currentPhase: {
    heading: string;
    name: string;
    isEmergent: boolean;
    lines: string[];
  } | null = null;

  for (const line of lines) {
    const phaseMatch = PHASE_RE.exec(line.trim());
    if (phaseMatch) {
      if (currentPhase) {
        phases.push(buildPhase(currentPhase, phases.length));
      }
      const headingType = phaseMatch[1].trim();
      currentPhase = {
        heading: headingType,
        name: phaseMatch[2].trim(),
        isEmergent: /emergent/i.test(headingType),
        lines: [],
      };
      continue;
    }
    if (currentPhase) {
      currentPhase.lines.push(line);
    }
  }

  if (currentPhase) {
    phases.push(buildPhase(currentPhase, phases.length));
  }

  return phases;
}

function buildPhase(
  raw: {
    heading: string;
    name: string;
    isEmergent: boolean;
    lines: string[];
  },
  index: number
): Phase {
  const body = raw.lines.join("\n");

  // Extract objective
  let objective = "";
  for (const line of raw.lines) {
    const objMatch = OBJECTIVE_RE.exec(line.trim());
    if (objMatch) {
      objective = objMatch[1].trim();
      break;
    }
  }

  const tasks = parseSprintForgeTasks(body);
  const id = raw.isEmergent
    ? `emergent-${index + 1}`
    : `phase-${index + 1}`;

  return {
    id,
    name: raw.name,
    objective,
    isEmergent: raw.isEmergent,
    tasks,
  };
}

// ---------------------------------------------------------------------------
// Table Parsers
// ---------------------------------------------------------------------------

export function parseDispositionTable(
  section: string
): DispositionEntry[] {
  const rows = parseMarkdownTable(section);
  return rows
    .filter((r) => r["#"] && r["Recommendation"])
    .map((r) => ({
      number: parseInt(r["#"], 10) || 0,
      recommendation: r["Recommendation"] ?? "",
      action: normalizeDispositionAction(r["Action"] ?? ""),
      where: r["Where"] ?? "",
      justification: r["Justification"] ?? "",
    }));
}

function normalizeDispositionAction(
  raw: string
): DispositionEntry["action"] {
  const normalized = raw.toLowerCase().trim();
  const map: Record<string, DispositionEntry["action"]> = {
    incorporated: "incorporated",
    deferred: "deferred",
    resolved: "resolved",
    "n/a": "n/a",
    "converted to phase": "converted-to-phase",
    "converted-to-phase": "converted-to-phase",
  };
  return map[normalized] ?? "n/a";
}

export function parseDebtTable(section: string): DebtItem[] {
  const rows = parseMarkdownTable(section);
  return rows
    .filter((r) => r["#"] && r["Item"])
    .map((r) => ({
      number: parseInt(r["#"]?.replace(/^D/, ""), 10) || 0,
      item: r["Item"] ?? "",
      origin: r["Origin"] ?? "",
      sprintTarget: r["Sprint Target"] ?? "",
      status: normalizeDebtStatus(r["Status"] ?? "open"),
      resolvedIn:
        r["Resolved In"] && r["Resolved In"] !== "—"
          ? r["Resolved In"]
          : undefined,
    }));
}

function normalizeDebtStatus(raw: string): DebtItem["status"] {
  const normalized = raw.toLowerCase().trim();
  const valid = [
    "open",
    "in-progress",
    "resolved",
    "deferred",
    "carry-over",
  ];
  return valid.includes(normalized)
    ? (normalized as DebtItem["status"])
    : "open";
}

export function parseFindingsConsolidation(
  section: string
): FindingsConsolidationEntry[] {
  const rows = parseMarkdownTable(section);
  return rows
    .filter((r) => r["#"] && r["Finding"])
    .map((r) => ({
      number: parseInt(r["#"], 10) || 0,
      finding: r["Finding"] ?? "",
      originPhase: r["Origin Phase"] ?? "",
      impact: normalizeImpact(r["Impact"] ?? "medium"),
      actionTaken: r["Action Taken"] ?? "",
    }));
}

function normalizeImpact(
  raw: string
): FindingsConsolidationEntry["impact"] {
  const normalized = raw.toLowerCase().trim();
  if (normalized === "high" || normalized === "medium" || normalized === "low") {
    return normalized;
  }
  return "medium";
}

// ---------------------------------------------------------------------------
// Main Sprint-Forge File Parser
// ---------------------------------------------------------------------------

export function parseSprintForgeFile(
  content: string
): Sprint {
  const metadata = parseSprintForgeMetadata(content);
  const sections = extractSections(content);

  // Parse phases — combine "Phases" and "Emergent Phases" sections
  let allPhases: Phase[] = [];
  if (sections["Phases"]) {
    allPhases = parsePhases(sections["Phases"]);
  }
  if (sections["Emergent Phases"]) {
    const emergent = parsePhases(sections["Emergent Phases"]);
    allPhases = [...allPhases, ...emergent];
  }

  // Flatten tasks from all phases for the base tasks array
  const allTasks = allPhases.flatMap((p) => p.tasks);

  // Parse tables
  const disposition = sections[
    "Disposition of Previous Sprint Recommendations"
  ]
    ? parseDispositionTable(
        sections["Disposition of Previous Sprint Recommendations"]
      )
    : undefined;

  const debtItems = sections["Accumulated Technical Debt"]
    ? parseDebtTable(sections["Accumulated Technical Debt"])
    : undefined;

  const findingsConsolidation = sections["Findings Consolidation"]
    ? parseFindingsConsolidation(sections["Findings Consolidation"])
    : undefined;

  // Parse Definition of Done
  const definitionOfDone = sections["Definition of Done"]
    ? extractChecklistItems(sections["Definition of Done"]).map(
        (item) => `${item.checked ? "[x]" : "[ ]"} ${item.text}`
      )
    : undefined;

  // Map extracted sections to SprintMarkdownSections keys
  const sprintSections = {
    sprintObjective: sections["Sprint Objective"] ?? undefined,
    disposition: sections["Disposition of Previous Sprint Recommendations"] ?? undefined,
    phases: sections["Phases"] ?? undefined,
    emergentPhases: sections["Emergent Phases"] ?? undefined,
    findingsConsolidation: sections["Findings Consolidation"] ?? undefined,
    technicalDebt: sections["Accumulated Technical Debt"] ?? undefined,
    definitionOfDone: sections["Definition of Done"] ?? undefined,
    retrospective: sections["Retro"] ?? undefined,
    recommendations: findRecommendationsSection(sections),
  };

  return {
    ...metadata,
    startDate: metadata.executionDate,
    tasks: allTasks,
    sections: sprintSections,
    phases: allPhases.length > 0 ? allPhases : undefined,
    disposition:
      disposition && disposition.length > 0 ? disposition : undefined,
    debtItems:
      debtItems && debtItems.length > 0 ? debtItems : undefined,
    findingsConsolidation:
      findingsConsolidation && findingsConsolidation.length > 0
        ? findingsConsolidation
        : undefined,
    definitionOfDone,
  };
}

function findRecommendationsSection(
  sections: Record<string, string>
): string | undefined {
  for (const key of Object.keys(sections)) {
    if (key.startsWith("Recommendations for Sprint")) {
      return sections[key];
    }
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Finding File Parser
// ---------------------------------------------------------------------------

export function parseFindingFile(
  content: string,
  filename: string
): Finding {
  const sections = extractSections(content);

  // Extract number from filename: "01-sprint-file-format.md" → 1
  const numMatch = /^(\d+)/.exec(filename);
  const number = numMatch ? parseInt(numMatch[1], 10) : 0;

  // Extract title from first # heading
  const titleMatch = /^#\s+(?:Finding:\s*)?(.+)$/m.exec(content);
  const title = titleMatch ? titleMatch[1].trim() : filename;

  // Extract id from filename without extension
  const id = filename.replace(/\.md$/, "");

  // Extract severity
  const severitySection = sections["Severity / Impact"] ?? "";
  const severityMatch =
    /\*\*(critical|high|medium|low)\*\*/i.exec(severitySection);
  const severity: FindingSeverity = severityMatch
    ? (severityMatch[1].toLowerCase() as FindingSeverity)
    : "medium";

  // Extract affected files
  const affectedSection = sections["Affected Files"] ?? "";
  const affectedFiles = affectedSection
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- "))
    .map((l) => l.replace(/^-\s+/, "").replace(/`/g, "").trim());

  // Extract recommendations
  const recsSection = sections["Recommendations"] ?? "";
  const recommendations = recsSection
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^\d+\./.test(l))
    .map((l) => l.replace(/^\d+\.\s*/, "").trim());

  return {
    id,
    number,
    title,
    summary: sections["Summary"] ?? "",
    severity,
    details: sections["Details"] ?? "",
    affectedFiles,
    recommendations,
  };
}

// ---------------------------------------------------------------------------
// Roadmap Sprint Summary Parser
// ---------------------------------------------------------------------------

export function parseRoadmapSprintSummary(
  content: string
): RoadmapSprintEntry[] {
  const sections = extractSections(content);
  const summarySection = sections["Sprint Summary"] ?? "";
  const rows = parseMarkdownTable(summarySection);

  return rows
    .filter((r) => r["Sprint"])
    .map((r) => {
      const number = parseInt(r["Sprint"], 10) || 0;
      return {
      number,
      sprintId: `sprint-${number}`,
      findingSource: r["Finding Source"] ?? "",
      version: r["Version"] ?? "",
      type: parseSprintType(r["Type"]) ?? ("refactor" as SprintType),
      focus: r["Focus"] ?? "",
      dependencies: (r["Dependencies"] ?? "")
        .split(",")
        .map((d) => d.trim())
        .filter((d) => d && d !== "—"),
      status: r["Status"] ?? "pending",
    };
    });
}

// ---------------------------------------------------------------------------
// Sprint-Forge README Parser
// ---------------------------------------------------------------------------

export function parseSprintForgeReadme(content: string): {
  name: string;
  type: string;
  createdAt: string;
  codebase: string;
  description: string;
} {
  // Extract title from first # heading
  const titleMatch = /^#\s+(.+?)(?:\s*—|\s*$)/m.exec(content);
  const name = titleMatch ? titleMatch[1].trim() : "Untitled Project";

  // Extract blockquote metadata
  const meta = extractBlockquoteMetadata(content);

  // Description = "What Is This" section or first paragraph
  const sections = extractSections(content);
  const description =
    sections["What Is This"] ??
    sections["Summary"] ??
    "";

  return {
    name,
    type: meta["Type"] ?? "unknown",
    createdAt: meta["Created"] ?? new Date().toISOString(),
    codebase: meta["Codebase"]?.replace(/`/g, "") ?? "",
    description: description.trim(),
  };
}
