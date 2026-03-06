import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import {
  detectSprintFormat,
  parseSprintForgeMetadata,
  parseSprintForgeTasks,
  parsePhases,
  parseDispositionTable,
  parseDebtTable,
  parseFindingsConsolidation,
  parseSprintForgeFile,
  parseFindingFile,
  parseRoadmapSprintSummary,
  parseSprintForgeReadme,
} from "../sprint-forge-parsers";

const FIXTURES = join(__dirname, "fixtures");
const readFixture = (name: string) =>
  readFileSync(join(FIXTURES, name), "utf-8");

// ---------------------------------------------------------------------------
// Format Detection
// ---------------------------------------------------------------------------

describe("detectSprintFormat", () => {
  it("detects YAML frontmatter", () => {
    const content = `---
id: sprint-1
name: Sprint 1
---
Body`;
    expect(detectSprintFormat(content)).toBe("frontmatter");
  });

  it("detects sprint-forge format", () => {
    const content = `# Sprint 1 — Foundation

> Source: findings/01.md
> Type: refactor`;
    expect(detectSprintFormat(content)).toBe("sprint-forge");
  });
});

// ---------------------------------------------------------------------------
// Sprint Metadata
// ---------------------------------------------------------------------------

describe("parseSprintForgeMetadata", () => {
  it("extracts metadata from sample sprint", () => {
    const content = readFixture("sample-sprint.md");
    const meta = parseSprintForgeMetadata(content);

    expect(meta.id).toBe("sprint-1");
    expect(meta.name).toBe("Sprint 1 — Foundation");
    expect(meta.status).toBe("closed"); // has execution date
    expect(meta.sprintType).toBe("refactor");
    expect(meta.version).toBe("0.2.0");
    expect(meta.source).toBe(
      "findings/01-architecture.md, findings/02-task-format.md"
    );
    expect(meta.previousSprint).toBeUndefined(); // "None"
    expect(meta.carryOverCount).toBe(0);
    expect(meta.executionDate).toBe("2026-03-01");
    expect(meta.executedBy).toBe("Claude");
  });

  it("detects planned status when no execution date", () => {
    const content = `# Sprint 2 — API

> Source: \`findings/03.md\`
> Execution Date: —
> Executed By: —`;

    const meta = parseSprintForgeMetadata(content);
    expect(meta.status).toBe("planned");
    expect(meta.executionDate).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Rich Task Parser
// ---------------------------------------------------------------------------

describe("parseSprintForgeTasks", () => {
  it("parses tasks with sub-items", () => {
    const body = `
**Tasks**:

- [x] **T1.1**: Create base schemas
  - Files: \`lib/types.ts\`
  - Evidence: All schemas compile and validate
  - Verification: \`npx tsc --noEmit\`

- [~] **T1.2**: Add extended task fields
  - Files: \`lib/types.ts\`, \`lib/config.ts\`
  - Evidence: Fields added
  - Verification: Schema validates with new fields
`;

    const tasks = parseSprintForgeTasks(body);
    expect(tasks).toHaveLength(2);

    expect(tasks[0].taskRef).toBe("T1.1");
    expect(tasks[0].title).toBe("Create base schemas");
    expect(tasks[0].status).toBe("done");
    expect(tasks[0].files).toEqual(["lib/types.ts"]);
    expect(tasks[0].evidence).toBe("All schemas compile and validate");
    expect(tasks[0].verification).toBe("npx tsc --noEmit");

    expect(tasks[1].taskRef).toBe("T1.2");
    expect(tasks[1].status).toBe("in_progress");
    expect(tasks[1].files).toEqual(["lib/types.ts", "lib/config.ts"]);
  });

  it("handles tasks without sub-items", () => {
    const body = `- [ ] **T3.1**: Simple task without details`;
    const tasks = parseSprintForgeTasks(body);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].taskRef).toBe("T3.1");
    expect(tasks[0].files).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Phase Parser
// ---------------------------------------------------------------------------

describe("parsePhases", () => {
  it("parses regular and emergent phases", () => {
    const content = readFixture("sample-sprint.md");
    // Extract just the Phases + Emergent Phases sections
    const phasesSection = content
      .split("## Phases")[1]
      ?.split("## Emergent Phases")[0] ?? "";
    const emergentSection = content
      .split("## Emergent Phases")[1]
      ?.split("## Findings Consolidation")[0] ?? "";

    const regular = parsePhases(phasesSection);
    expect(regular).toHaveLength(2);
    expect(regular[0].name).toBe("Type System");
    expect(regular[0].isEmergent).toBe(false);
    expect(regular[0].tasks).toHaveLength(2);
    expect(regular[1].name).toBe("Parsers");

    const emergent = parsePhases(emergentSection);
    expect(emergent).toHaveLength(1);
    expect(emergent[0].name).toBe("Test Fixtures");
    expect(emergent[0].isEmergent).toBe(true);
    expect(emergent[0].tasks).toHaveLength(1);
    expect(emergent[0].tasks[0].taskRef).toBe("TE.1");
  });
});

// ---------------------------------------------------------------------------
// Table Parsers
// ---------------------------------------------------------------------------

describe("parseDebtTable", () => {
  it("parses debt items from table", () => {
    const section = `| # | Item | Origin | Sprint Target | Status | Resolved In |
|---|------|--------|--------------|--------|-------------|
| D1 | Logo hardcoded in sidebar | Pre-existing | product decision | open | — |
| D2 | Missing error boundaries | Sprint 1 Phase 2 | Sprint 2 | open | — |`;

    const items = parseDebtTable(section);
    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({
      number: 1,
      item: "Logo hardcoded in sidebar",
      origin: "Pre-existing",
      sprintTarget: "product decision",
      status: "open",
      resolvedIn: undefined,
    });
  });
});

describe("parseDispositionTable", () => {
  it("parses disposition entries", () => {
    const section = `| # | Recommendation | Action | Where | Justification |
|---|---------------|--------|-------|---------------|
| 1 | Add error handling | Incorporated | Phase 2, T2.3 | Directly needed |
| 2 | Create cache layer | Deferred | Sprint 5 | Too complex now |`;

    const entries = parseDispositionTable(section);
    expect(entries).toHaveLength(2);
    expect(entries[0].action).toBe("incorporated");
    expect(entries[1].action).toBe("deferred");
  });
});

describe("parseFindingsConsolidation", () => {
  it("parses consolidation entries", () => {
    const section = `| # | Finding | Origin Phase | Impact | Action Taken |
|---|---------|-------------|--------|-------------|
| 1 | Zod v4 API change | Phase 1 | medium | Used .merge() instead |
| 2 | gray-matter conflicts | Phase 2 | high | Added format detection |`;

    const entries = parseFindingsConsolidation(section);
    expect(entries).toHaveLength(2);
    expect(entries[0].impact).toBe("medium");
    expect(entries[1].impact).toBe("high");
  });
});

// ---------------------------------------------------------------------------
// Main Sprint File Parser
// ---------------------------------------------------------------------------

describe("parseSprintForgeFile", () => {
  it("parses a complete sprint-forge file", () => {
    const content = readFixture("sample-sprint.md");
    const sprint = parseSprintForgeFile(content);

    expect(sprint.id).toBe("sprint-1");
    expect(sprint.name).toBe("Sprint 1 — Foundation");
    expect(sprint.status).toBe("closed");
    expect(sprint.sprintType).toBe("refactor");
    expect(sprint.version).toBe("0.2.0");
    expect(sprint.objective).toContain("foundational type system");

    // Phases
    expect(sprint.phases).toBeDefined();
    expect(sprint.phases!.length).toBeGreaterThanOrEqual(2);

    // Tasks flattened
    expect(sprint.tasks.length).toBeGreaterThan(0);

    // Debt items
    expect(sprint.debtItems).toBeDefined();
    expect(sprint.debtItems!.length).toBe(2);

    // Findings consolidation
    expect(sprint.findingsConsolidation).toBeDefined();
    expect(sprint.findingsConsolidation!.length).toBe(2);

    // Definition of Done
    expect(sprint.definitionOfDone).toBeDefined();
    expect(sprint.definitionOfDone!.length).toBeGreaterThan(0);

    // Sections backward compat
    expect(sprint.sections).toBeDefined();
    expect(sprint.sections?.retrospective).toContain(
      "Type system was straightforward"
    );
  });
});

// ---------------------------------------------------------------------------
// Section Expansion (Sprint 3 — T6.2)
// ---------------------------------------------------------------------------

describe("parseSprintForgeFile section expansion", () => {
  it("populates all section keys from sprint-forge content", () => {
    const content = readFixture("sample-sprint.md");
    const sprint = parseSprintForgeFile(content);

    expect(sprint.sections).toBeDefined();
    // Verify the new expanded keys exist
    expect(sprint.sections!.sprintObjective).toContain("foundational type system");
    expect(sprint.sections!.phases).toBeDefined();
    expect(sprint.sections!.technicalDebt).toBeDefined();
    expect(sprint.sections!.findingsConsolidation).toBeDefined();
    expect(sprint.sections!.definitionOfDone).toBeDefined();
    expect(sprint.sections!.retrospective).toBeDefined();
    expect(sprint.sections!.recommendations).toBeDefined();
  });

  it("maps SPRINT_SECTIONS config keys to SprintMarkdownSections", async () => {
    // Import config to verify all section keys have config entries
    const { SPRINT_SECTIONS, SPRINT_SECTION_ICONS } = await import("@/lib/config");

    const expectedKeys = [
      "sprintObjective",
      "disposition",
      "phases",
      "emergentPhases",
      "findingsConsolidation",
      "technicalDebt",
      "definitionOfDone",
      "retrospective",
      "recommendations",
    ];

    // All expected keys should have a SPRINT_SECTIONS entry
    for (const key of expectedKeys) {
      const entry = SPRINT_SECTIONS.find((s: { key: string }) => s.key === key);
      expect(entry, `Missing SPRINT_SECTIONS entry for '${key}'`).toBeDefined();
      expect(entry!.label).toBeTruthy();
      expect(entry!.description).toBeTruthy();
    }

    // All expected keys should have an icon
    for (const key of expectedKeys) {
      expect(
        SPRINT_SECTION_ICONS[key as keyof typeof SPRINT_SECTION_ICONS],
        `Missing icon for '${key}'`
      ).toBeDefined();
    }
  });
});

// ---------------------------------------------------------------------------
// Finding File Parser
// ---------------------------------------------------------------------------

describe("parseFindingFile", () => {
  it("parses a finding file", () => {
    const content = readFixture("sample-finding.md");
    const finding = parseFindingFile(
      content,
      "01-architecture-layer-violations.md"
    );

    expect(finding.id).toBe("01-architecture-layer-violations");
    expect(finding.number).toBe(1);
    expect(finding.title).toBe("Architecture Layer Violations");
    expect(finding.severity).toBe("high");
    expect(finding.summary).toContain("Service layer imports");
    expect(finding.affectedFiles).toEqual([
      "lib/services/foo.ts",
      "lib/services/bar.ts",
      "components/dashboard.tsx",
      "components/sidebar.tsx",
    ]);
    expect(finding.recommendations).toHaveLength(3);
    expect(finding.recommendations[0]).toContain("Extract shared types");
  });
});

// ---------------------------------------------------------------------------
// Roadmap Sprint Summary Parser
// ---------------------------------------------------------------------------

describe("parseRoadmapSprintSummary", () => {
  it("parses sprint summary table", () => {
    const content = readFixture("sample-roadmap.md");
    const entries = parseRoadmapSprintSummary(content);

    expect(entries).toHaveLength(3);
    expect(entries[0]).toMatchObject({
      number: 1,
      sprintId: "sprint-1",
      version: "0.2.0",
      type: "refactor",
      focus: "Domain types and parsers",
      status: "completed",
    });
    expect(entries[1].number).toBe(2);
    expect(entries[1].sprintId).toBe("sprint-2");
    expect(entries[1].dependencies).toEqual(["Sprint 1"]);
    expect(entries[2].number).toBe(3);
    expect(entries[2].sprintId).toBe("sprint-3");
  });
});

// ---------------------------------------------------------------------------
// Sprint-Forge README Parser
// ---------------------------------------------------------------------------

describe("parseSprintForgeReadme", () => {
  it("parses a sprint-forge README", () => {
    const content = readFixture("sample-readme.md");
    const readme = parseSprintForgeReadme(content);

    expect(readme.name).toBe("project-name");
    expect(readme.type).toBe("refactor");
    expect(readme.createdAt).toBe("2026-03-01");
    expect(readme.codebase).toBe("/Users/dev/project");
    expect(readme.description).toContain("working artifacts");
  });
});
