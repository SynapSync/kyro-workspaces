---
title: "Sprint 1 — Domain Types & Sprint-Forge Parsers"
date: "2026-03-05"
updated: "2026-03-06"
project: "kyro-sprint-forge-reader"
type: "sprint-plan"
status: "completed"
version: "1.0"
sprint: 1
progress: 100
next_doc: "[[SPRINT-2-project-registry-and-api-refactor]]"
parent_doc: "[[ROADMAP]]"
agents:
  - "claude-opus-4-6"
tags:
  - "kyro-sprint-forge-reader"
  - "sprint-plan"
  - "sprint-1"
changelog:
  - version: "1.0"
    date: "2026-03-05"
    changes: ["Sprint generated and executed"]
related:
  - "[[ROADMAP]]"
  - "[[01-sprint-file-format-incompatibility]]"
  - "[[02-task-format-and-phase-structure]]"
  - "[[04-missing-domain-concepts]]"
---

# Sprint 1 — Domain Types & Sprint-Forge Parsers

> Source: `findings/01-sprint-file-format-incompatibility.md`, `findings/02-task-format-and-phase-structure.md`, `findings/04-missing-domain-concepts.md`
> Previous Sprint: None
> Version Target: 0.2.0
> Type: refactor
> Carry-over: 0 items from previous sprint
> Execution Date: 2026-03-05
> Executed By: Claude

---

## Sprint Objective

Create the complete type system and parsing layer for sprint-forge output. This sprint establishes the foundation that every subsequent sprint depends on: Zod schemas for all sprint-forge domain concepts (Finding, DebtItem, Phase, DispositionEntry, SprintType), a rich task parser that handles `**T1.1**: description` with sub-items, markdown utilities for section extraction and table parsing, and format auto-detection so Kyro can read both its own YAML frontmatter files and sprint-forge blockquote files. Without these parsers, Kyro cannot read any sprint-forge data.

---

## Disposition of Previous Sprint Recommendations

N/A — This is Sprint 1.

---

## Phases

### Phase 1 — New Zod Types

**Objective**: Add all sprint-forge domain types to `lib/types.ts` so the parsing layer and UI have a stable type foundation.

**Tasks**:

- [x] **T1.1**: Add `SprintTypeSchema` enum — `audit | refactor | feature | bugfix | debt`
  - Files: `lib/types.ts`
  - Evidence: Added at line 61-67 as `z.enum(["audit", "refactor", "feature", "bugfix", "debt"])`
  - Verification: `npx tsc --noEmit` passes

- [x] **T1.2**: Add `FindingSchema` — id, number, title, summary, severity, details, affectedFiles, recommendations, linkedSprints
  - Files: `lib/types.ts`
  - Evidence: Added at lines 76-86 with `FindingSeveritySchema` enum at lines 69-74
  - Verification: Schema compiles and validates

- [x] **T1.3**: Add `DebtItemSchema` — number, item, origin, sprintTarget, status, resolvedIn
  - Files: `lib/types.ts`
  - Evidence: Added at lines 96-103 with `DebtStatusSchema` at lines 88-94
  - Verification: Schema compiles and validates

- [x] **T1.4**: Add `PhaseSchema` — id, name, objective, isEmergent, tasks array
  - Files: `lib/types.ts`
  - Evidence: Added at lines 105-111, references TaskSchema for nested tasks
  - Verification: Schema validates phase with nested tasks

- [x] **T1.5**: Add `DispositionEntrySchema` — number, recommendation, action, where, justification
  - Files: `lib/types.ts`
  - Evidence: Added at lines 121-127 with `DispositionActionSchema` at lines 113-119
  - Verification: Schema compiles

- [x] **T1.6**: Add `FindingsConsolidationEntrySchema` — number, finding, originPhase, impact, actionTaken
  - Files: `lib/types.ts`
  - Evidence: Added at lines 129-135
  - Verification: Schema compiles

- [x] **T1.7**: Extend `TaskSchema` with optional sprint-forge fields — `taskRef`, `files`, `evidence`, `verification`
  - Files: `lib/types.ts`
  - Evidence: Added 4 optional fields at lines 34-38; existing Task objects still validate (fields are optional)
  - Verification: Existing tests pass; new fields accepted when present

- [x] **T1.8**: Create `SprintForgeSprintSchema` that extends `SprintSchema`
  - Files: `lib/types.ts`
  - Evidence: Added at lines 173-186 using `SprintSchema.extend()` — placed after SprintSchema definition to avoid TDZ error
  - Verification: Schema validates complete sprint-forge sprint; plain Sprint objects still validate with SprintSchema

- [x] **T1.9**: Create `SprintForgeMarkdownSectionsSchema` extending `SprintMarkdownSectionsSchema`
  - Files: `lib/types.ts`
  - Evidence: Added at lines 137-145 with 6 additional section keys
  - Verification: New section keys type-check correctly

- [x] **T1.10**: Export all new TypeScript types via `z.infer<>`
  - Files: `lib/types.ts`
  - Evidence: 13 new type exports added at lines 246-262: SprintType, FindingSeverity, Finding, DebtStatus, DebtItem, Phase, DispositionAction, DispositionEntry, FindingsConsolidationEntry, SprintForgeMarkdownSections, SprintForgeSprint, RoadmapSprintEntry
  - Verification: All types importable from `@/lib/types`

### Phase 2 — Markdown Utilities

**Objective**: Create reusable markdown parsing utilities that all subsequent parsers depend on: section extractor and table parser.

**Tasks**:

- [x] **T2.1**: Create `lib/file-format/markdown-utils.ts` with `extractSections()`
  - Files: `lib/file-format/markdown-utils.ts`
  - Evidence: Function splits by `## ` headings, returns `Record<string, string>` map; 13 tests pass
  - Verification: Tests in `markdown-utils.test.ts` all pass

- [x] **T2.2**: Add `parseMarkdownTable()`
  - Files: `lib/file-format/markdown-utils.ts`
  - Evidence: Handles header row, separator, data rows; returns `Record<string, string>[]`
  - Verification: Test verifies correct parsing of standard tables

- [x] **T2.3**: Add `extractBlockquoteMetadata()`
  - Files: `lib/file-format/markdown-utils.ts`
  - Evidence: Extracts `> Key: value` lines into key-value map
  - Verification: Test verifies extraction from sprint-forge header blockquotes

- [x] **T2.4**: Add `extractChecklistItems()`
  - Files: `lib/file-format/markdown-utils.ts`
  - Evidence: Parses `- [ ]` and `- [x]` lines, returns `{ checked, text }[]`
  - Verification: Test verifies correct parsing of DoD checklist items

- [x] **T2.5**: Add `extractHeadingTitle()`
  - Files: `lib/file-format/markdown-utils.ts`
  - Evidence: Parses `# Sprint N — title` with em dash, en dash, or hyphen
  - Verification: Tests cover all dash variants and null return for non-matching

### Phase 3 — Sprint-Forge Sprint Parser

**Objective**: Implement the main `parseSprintForgeFile()` function that extracts all structured data from a sprint-forge sprint markdown file, plus a format auto-detection function.

**Tasks**:

- [x] **T3.1**: Create `lib/file-format/sprint-forge-parsers.ts` with `detectSprintFormat()`
  - Files: `lib/file-format/sprint-forge-parsers.ts`
  - Evidence: Checks for `---` at start (frontmatter) vs anything else (sprint-forge)
  - Verification: Test passes for both format types

- [x] **T3.2**: Implement `parseSprintForgeMetadata()`
  - Files: `lib/file-format/sprint-forge-parsers.ts`
  - Evidence: Uses `extractHeadingTitle()` + `extractBlockquoteMetadata()` to build metadata; detects status from execution date
  - Verification: Test validates all metadata fields from sample sprint

- [x] **T3.3**: Implement rich task parser `parseSprintForgeTasks()`
  - Files: `lib/file-format/sprint-forge-parsers.ts`
  - Evidence: Regex `TASK_RE` captures `**T1.1**: description`; `SUB_ITEM_RE` captures Files/Evidence/Verification sub-items
  - Verification: Test verifies taskRef, files, evidence, verification populated correctly

- [x] **T3.4**: Implement `parsePhases()`
  - Files: `lib/file-format/sprint-forge-parsers.ts`
  - Evidence: Parses `### Phase N — Name` and `### Emergent Phase — Name` headings; extracts objectives and tasks per phase
  - Verification: Test validates regular and emergent phases from sample sprint

- [x] **T3.5**: Implement `parseDispositionTable()`
  - Files: `lib/file-format/sprint-forge-parsers.ts`
  - Evidence: Uses `parseMarkdownTable()`, normalizes action values to schema enum
  - Verification: Test parses disposition entries with correct action types

- [x] **T3.6**: Implement `parseDebtTable()`
  - Files: `lib/file-format/sprint-forge-parsers.ts`
  - Evidence: Uses `parseMarkdownTable()`, handles `D1` prefix stripping, normalizes status values
  - Verification: Test parses debt items with correct structure

- [x] **T3.7**: Implement `parseFindingsConsolidation()`
  - Files: `lib/file-format/sprint-forge-parsers.ts`
  - Evidence: Uses `parseMarkdownTable()`, normalizes impact values
  - Verification: Test parses consolidation entries correctly

- [x] **T3.8**: Implement main `parseSprintForgeFile()`
  - Files: `lib/file-format/sprint-forge-parsers.ts`
  - Evidence: Orchestrates all sub-parsers; returns complete SprintForgeSprint with phases, disposition, debtItems, findingsConsolidation, definitionOfDone, backward-compatible sections
  - Verification: Test validates complete parsing of sample sprint fixture

- [x] **T3.9**: Update `parseSprintFile()` in `parsers.ts` with auto-detection
  - Files: `lib/file-format/parsers.ts`
  - Evidence: Added ESM import of `detectSprintFormat` + `parseSprintForgeFile`; delegates to sprint-forge parser when detected; maps result to base Sprint type
  - Verification: Backward-compat tests pass for both YAML and sprint-forge formats

### Phase 4 — Finding & Roadmap Parsers

**Objective**: Implement parsers for finding files and ROADMAP.md — the other key sprint-forge artifacts.

**Tasks**:

- [x] **T4.1**: Implement `parseFindingFile()`
  - Files: `lib/file-format/sprint-forge-parsers.ts`
  - Evidence: Extracts number from filename, title from heading, severity from bold text, affected files from list, recommendations from numbered list
  - Verification: Test validates parsing of sample-finding.md fixture

- [x] **T4.2**: Implement `parseRoadmapSprintSummary()`
  - Files: `lib/file-format/sprint-forge-parsers.ts`
  - Evidence: Parses Sprint Summary table from ROADMAP.md; extracts sprint number, finding source, version, type, focus, dependencies, status
  - Verification: Test validates 3 entries from sample-roadmap.md fixture

- [x] **T4.3**: Add `RoadmapSprintEntrySchema` Zod type
  - Files: `lib/types.ts`
  - Evidence: Added at lines 188-196 with number, findingSource, version, type, focus, dependencies, status fields
  - Verification: Schema validates entries from parseRoadmapSprintSummary

- [x] **T4.4**: Implement `parseSprintForgeReadme()`
  - Files: `lib/file-format/sprint-forge-parsers.ts`
  - Evidence: Extracts name from heading, type/created/codebase from blockquotes, description from "What Is This" section
  - Verification: Test validates parsing of sample-readme.md fixture

- [x] **T4.5**: Update `parseProjectReadme()` with format auto-detection
  - Files: `lib/file-format/parsers.ts`
  - Evidence: Added ESM import of `parseSprintForgeReadme`; delegates when sprint-forge format detected; maps to Project fields
  - Verification: Backward-compat tests pass for both YAML and sprint-forge README formats

### Phase 5 — Parser Tests

**Objective**: Comprehensive unit tests for all new parsers using real sprint-forge sample files as fixtures.

**Tasks**:

- [x] **T5.1**: Create test fixtures directory with sample files
  - Files: `lib/file-format/__tests__/fixtures/sample-sprint.md`, `sample-finding.md`, `sample-roadmap.md`, `sample-readme.md`
  - Evidence: 4 fixture files created with valid sprint-forge formatted content
  - Verification: Files exist and are used by test suites

- [x] **T5.2**: Write unit tests for `markdown-utils.ts`
  - Files: `lib/file-format/__tests__/markdown-utils.test.ts`
  - Evidence: 13 tests covering all 5 utility functions with edge cases
  - Verification: `vitest run` — 13/13 pass

- [x] **T5.3**: Write unit tests for sprint-forge parsers
  - Files: `lib/file-format/__tests__/sprint-forge-parsers.test.ts`
  - Evidence: 14 tests covering detectSprintFormat, parseSprintForgeMetadata, parseSprintForgeTasks, parsePhases, parseDebtTable, parseDispositionTable, parseFindingsConsolidation, parseSprintForgeFile
  - Verification: `vitest run` — 14/14 pass

- [x] **T5.4**: Write unit tests for finding and roadmap parsers
  - Files: `lib/file-format/__tests__/sprint-forge-parsers.test.ts`
  - Evidence: Tests for parseFindingFile, parseRoadmapSprintSummary, parseSprintForgeReadme included in same test file
  - Verification: All pass using fixture files

- [x] **T5.5**: Write backward-compatibility tests
  - Files: `lib/file-format/__tests__/parsers-compat.test.ts`
  - Evidence: 4 tests covering YAML frontmatter sprint parsing, sprint-forge auto-detection, YAML README parsing, sprint-forge README auto-detection
  - Verification: `vitest run` — 4/4 pass; existing sprint.test.ts 7/7 pass

---

## Emergent Phases

No emergent phases were needed. All planned work was sufficient to meet the sprint objective.

---

## Findings Consolidation

| # | Finding | Origin Phase | Impact | Action Taken |
|---|---------|-------------|--------|-------------|
| 1 | SprintForgeSprintSchema must be declared after SprintSchema to avoid temporal dead zone error | Phase 1 | medium | Reordered schema declarations in types.ts — SprintForgeSprintSchema placed after SprintSchema |
| 2 | `require()` calls fail in ESM/Vitest context — cannot use dynamic require for sprint-forge-parsers | Phase 3 | high | Replaced `require()` with top-level ESM `import` statements in parsers.ts |
| 3 | Vitest config includes only `lib/**/*.test.ts` — test fixtures placed inside `lib/file-format/__tests__/fixtures/` accordingly | Phase 5 | low | Placed tests inside lib/ directory tree to match existing vitest include pattern |

---

## Accumulated Technical Debt

| # | Item | Origin | Sprint Target | Status | Resolved In |
|---|------|--------|--------------|--------|-------------|
| D1 | Logo "Clever" hardcoded in sidebar | Pre-existing | product decision | open | — |
| D2 | Service factory always returns mock — switching logic pending | Pre-existing | Sprint 2 | open | — |
| D3 | Loading UI only in ContentRouter — sub-entities have no per-fetch states | Pre-existing | Sprint 4 | open | — |
| D4 | `parseSprintForgeFile()` recommendations section uses heuristic matching for "Recommendations for Sprint N+1" heading | Sprint 1 Phase 3 | Sprint 3 | open | — |

**Status values**: `open` | `in-progress` | `resolved` | `deferred` | `carry-over`

**Rules**:
- Never delete a row — only change status
- New items are appended at the bottom
- Inherited items keep their original numbers
- When resolved, fill "Resolved In" with the sprint number

---

## Definition of Done

- [x] All new Zod schemas added to `lib/types.ts` and exportable
- [x] `markdown-utils.ts` created with all 5 utility functions
- [x] `sprint-forge-parsers.ts` created with all parser functions
- [x] `parseSprintForgeFile()` returns complete SprintForgeSprint from a real sprint-forge file
- [x] `parseFindingFile()` correctly parses finding files from this project
- [x] `parseRoadmapSprintSummary()` correctly parses ROADMAP.md from this project
- [x] `parseSprintFile()` auto-detects format and handles both YAML and sprint-forge
- [x] `parseProjectReadme()` auto-detects format and handles both YAML and sprint-forge
- [x] All unit tests pass (`vitest run`) — 77/77 pass, 12 test files
- [x] No regressions — existing YAML frontmatter parsing still works (sprint.test.ts 7/7 pass)
- [x] All emergent phase tasks completed (no emergent phases needed)
- [x] Accumulated debt table updated (D4 added)
- [x] Retro section filled
- [x] Recommendations for Sprint 2 documented
- [x] Re-entry prompts updated

---

## Retro

### What Went Well

- All 30 tasks completed in a single execution pass with no blockers
- The Zod `.extend()` pattern worked cleanly for SprintForgeSprintSchema extending SprintSchema
- Markdown utilities were highly reusable — each parser in Phase 3-4 composed them naturally
- Backward compatibility maintained perfectly — all 7 existing sprint parser tests still pass
- Test fixtures based on realistic sprint-forge output gave high confidence in parser correctness
- Total: 77 tests pass, 0 failures, 12 test files

### What Didn't Go Well

- Initial placement of SprintForgeSprintSchema before SprintSchema caused a temporal dead zone error (TypeScript `const` before declaration) — required reordering
- First attempt used `require()` for conditional imports in parsers.ts, which fails in ESM/Vitest — had to switch to top-level ESM imports

### Surprises / Unexpected Findings

- The vitest config only includes `lib/**/*.test.ts`, not `__tests__/` at the project root — all test files must live under `lib/`
- `extractBlockquoteMetadata()` captures the backtick wrapping in Source values (e.g., `` `findings/01-arch.md` ``) — consumers must strip backticks themselves

### New Technical Debt Detected

- D4: `parseSprintForgeFile()` uses a heuristic to find the "Recommendations for Sprint N+1" section by searching for any key starting with "Recommendations for Sprint" — this is fragile if the heading format changes

---

## Recommendations for Sprint 2

1. When implementing the project registry (`projects.json`), ensure the path validation checks for both `README.md` and `sprints/` directory in the target path — use the new `parseSprintForgeReadme()` parser to validate the README format
2. Update `resolveAndGuard()` to accept a per-project root path from the registry instead of the global workspace path — the new parsers work with any filesystem path, but the API guard layer is still workspace-scoped
3. The `parseSprintForgeFile()` flattens tasks from phases into the base `tasks` array for backward compatibility — Sprint 2 API routes should consider returning both `tasks` (flat) and `phases` (structured) to support both kanban and phase-grouped views
4. Consider adding an `index.ts` barrel export in `lib/file-format/` to simplify imports — currently consumers need to know whether to import from `parsers.ts` or `sprint-forge-parsers.ts`
5. The debt table parser strips `D` prefix from numbers (e.g., `D1` → `1`) — ensure the serializer in Sprint 2 re-adds the prefix when writing back if Kyro ever needs write support
