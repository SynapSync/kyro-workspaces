---
title: "Sprint 5 — New Views, E2E & Polish"
date: "2026-03-05"
updated: "2026-03-06"
project: "kyro-sprint-forge-reader"
type: "sprint-plan"
status: "completed"
version: "1.0"
sprint: 5
progress: 100
previous_doc: "[[SPRINT-4-ui-adaptation]]"
next_doc: "[[SPRINT-6-markdown-rendering-pipeline]]"
parent_doc: "[[ROADMAP]]"
agents:
  - "claude-opus-4-6"
tags:
  - "kyro-sprint-forge-reader"
  - "sprint-plan"
  - "sprint-5"
changelog:
  - version: "1.0"
    date: "2026-03-05"
    changes: ["Sprint generated and executed"]
related:
  - "[[ROADMAP]]"
---

# Sprint 5 — New Views, E2E & Polish

> Source: Cross-cutting (all findings, accumulated debt from previous sprints)
> Previous Sprint: `sprints/SPRINT-4-ui-adaptation.md`
> Version Target: 1.0.0
> Type: feature
> Carry-over: 0 items from previous sprint
> Execution Date: 2026-03-05
> Executed By: Claude

---

## Sprint Objective

Complete the Kyro sprint-forge reader by consolidating the type system (eliminating the redundant `SprintForgeSprintSchema`), removing orphaned components left from Sprint 4's edit-code removal, enhancing the findings page with a detail view for full markdown rendering, building a debt dashboard that aggregates technical debt across all sprints, adding Playwright E2E tests for the full user workflow (add project, navigate sprints, view findings/roadmap), and updating project memory. After this sprint, Kyro 1.0.0 is a fully functional, well-tested reader for any sprint-forge output directory.

---

## Disposition of Previous Sprint Recommendations

| # | Recommendation | Action | Where | Justification |
|---|---------------|--------|-------|---------------|
| 1 | Consolidate `SprintForgeSprintSchema` into `SprintSchema` — the distinction is no longer useful since all sprint-forge fields were promoted to the base type. Remove the extended schema and update all imports (resolves D9) | Incorporated | Phase 1, T1.1–T1.2 | Direct cleanup — all fields already on base schema |
| 2 | Delete unused components: `TaskDialog`, and verify whether `MarkdownEditor` and `VersionHistory` still have consumers. Remove if orphaned (resolves D10, D11) | Incorporated | Phase 1, T1.3–T1.4 | Confirmed all three are orphaned — zero import references |
| 3 | Add E2E tests with Playwright for the full workflow: add project via dialog, navigate to sprint list, open sprint detail, view findings page, view roadmap page | Incorporated | Phase 3, T3.1–T3.3 | Core quality gate for 1.0.0 release |
| 4 | Enhance findings page with detail view — clicking a finding should show full rendered markdown with affected files list and recommendations | Incorporated | Phase 2, T2.1–T2.3 | Findings page exists but lacks detail/drill-down |
| 5 | Add debt dashboard page that aggregates `debtItems` across all sprints for the active project — show open count, resolution trend, and origin breakdown | Incorporated | Phase 2, T2.4–T2.6 | Completes the new views planned in the roadmap |

---

## Phases

### Phase 1 — Schema Consolidation & Dead Code Cleanup

**Objective**: Eliminate the redundant `SprintForgeSprintSchema` (D9) and remove orphaned components (D10, D11). This cleans up the type system and reduces dead code.

**Tasks**:

- [x] **T1.1**: Consolidate `SprintForgeSprintSchema` into `SprintSchema` in `lib/types.ts` — remove the `SprintForgeSprintSchema` export entirely. All its fields (`sprintType`, `phases`, `disposition`, `debtItems`, `findingsConsolidation`, `definitionOfDone`) are already optional on the base `SprintSchema`. Remove the `SprintForgeSprint` type alias.
  - Files: `lib/types.ts`
  - Evidence: —
  - Verification: `SprintForgeSprintSchema` and `SprintForgeSprint` no longer exist; `tsc --noEmit` passes

- [x] **T1.2**: Update all imports that reference `SprintForgeSprintSchema` or `SprintForgeSprint` — replace with `SprintSchema` / `Sprint`. Check parsers, services, API routes, and tests.
  - Files: `lib/file-format/sprint-forge-parsers.ts`, `lib/types.ts`, any test files referencing the extended schema
  - Evidence: —
  - Verification: `grep -r "SprintForgeSprint" --include="*.ts" --include="*.tsx"` returns zero results (excluding this sprint doc)

- [x] **T1.3**: Delete orphaned `TaskDialog` component — confirmed zero consumers after Sprint 4 removed all edit/create UI from the sprint board.
  - Files: `components/kanban/task-dialog.tsx` (DELETE)
  - Evidence: —
  - Verification: File deleted; `tsc --noEmit` passes; no broken imports

- [x] **T1.4**: Delete orphaned `MarkdownEditor` and `VersionHistory` components — confirmed zero consumers after Sprint 4 removed edit UI from documents and sprint detail pages.
  - Files: `components/editor/markdown-editor.tsx` (DELETE), `components/editor/version-history.tsx` (DELETE)
  - Evidence: —
  - Verification: Files deleted; `tsc --noEmit` passes; no broken imports

- [x] **T1.5**: Run `vitest run` to confirm no test regressions after schema consolidation and file deletions.
  - Files: —
  - Evidence: —
  - Verification: All tests pass; zero failures

### Phase 2 — View Enhancements

**Objective**: Add finding detail view with full markdown rendering, and build a debt dashboard page that aggregates technical debt across all sprints.

**Tasks**:

- [x] **T2.1**: Add finding detail view state to the store — add `activeFindingId: string | null` and `setActiveFindingId` action. When set, the findings page shows the detail view instead of the list.
  - Files: `lib/store.ts`
  - Evidence: —
  - Verification: Store action sets and clears `activeFindingId`

- [x] **T2.2**: Build finding detail view in `FindingsPage` — when `activeFindingId` is set, show the full finding: title, severity badge, summary, rendered markdown body (`finding.details`), affected files list, recommendations. Add a "Back to findings" button to clear the selection.
  - Files: `components/pages/findings-page.tsx`
  - Evidence: —
  - Verification: Clicking a finding card shows the detail view; back button returns to list

- [x] **T2.3**: Make finding cards clickable — wrap each finding card in the list view with an `onClick` handler that calls `setActiveFindingId(finding.id)`.
  - Files: `components/pages/findings-page.tsx`
  - Evidence: —
  - Verification: Cards have hover cursor and navigate to detail view on click

- [x] **T2.4**: Add debt dashboard navigation — add a "Debt" entry to `NAV_ITEMS` in `lib/config.ts` with an appropriate icon (e.g., `AlertTriangle` from lucide). Add routing in `ContentRouter`.
  - Files: `lib/config.ts`, `components/content-router.tsx`
  - Evidence: —
  - Verification: Sidebar shows "Debt" nav item; clicking navigates to debt page

- [x] **T2.5**: Build `DebtDashboardPage` component — aggregates `debtItems` from all sprints in the active project. Shows: total items count, open/resolved/deferred breakdown with colored badges, a combined `DebtTable` with all items sorted by status (open first), and an origin breakdown (which sprint/phase created each item).
  - Files: `components/pages/debt-dashboard-page.tsx` (NEW)
  - Evidence: —
  - Verification: Page renders aggregated debt from all sprints; summary stats are correct

- [x] **T2.6**: Handle the case where sprints have no `debtItems` — default to empty array. Show an empty state ("No debt items tracked") when no debt data exists.
  - Files: `components/pages/debt-dashboard-page.tsx`
  - Evidence: —
  - Verification: Page renders gracefully with no debt data

### Phase 3 — E2E Testing

**Objective**: Add Playwright end-to-end tests covering the core user workflow. Tests use the existing Playwright configuration (`tests/e2e/`, port 4173).

**Tasks**:

- [x] **T3.1**: Create E2E test fixture — set up a temporary sprint-forge directory structure with README.md, ROADMAP.md, `sprints/SPRINT-1.md`, and `findings/01-sample.md` for tests. Create a shared fixture helper in `tests/e2e/fixtures/`.
  - Files: `tests/e2e/fixtures/sprint-forge-fixture.ts` (NEW)
  - Evidence: —
  - Verification: Fixture creates and cleans up a valid sprint-forge directory

- [x] **T3.2**: Create navigation E2E test — test that after workspace initialization with a project, the sidebar shows project name, and clicking through nav items (Overview, Sprints, Findings, Roadmap, Debt) renders the correct pages.
  - Files: `tests/e2e/navigation.spec.ts` (NEW)
  - Evidence: —
  - Verification: `npx playwright test navigation` passes

- [x] **T3.3**: Create sprint detail E2E test — test clicking a sprint from the sprints list navigates to the sprint detail page, and the section tabs (Phases, Retro, Debt, etc.) render content.
  - Files: `tests/e2e/sprint-detail.spec.ts` (NEW)
  - Evidence: —
  - Verification: `npx playwright test sprint-detail` passes

### Phase 4 — Documentation & Memory Update

**Objective**: Update project memory and clean up stale references to reflect the completed 1.0.0 architecture.

**Tasks**:

- [x] **T4.1**: Update `MEMORY.md` — reflect Sprint 5 completion, updated debt table, final architecture notes (schema consolidated, dead code removed, new views added), and updated sprint plan status.
  - Files: `/Users/rperaza/.claude/projects/-Users-rperaza-joicodev-ideas-kyro/memory/MEMORY.md`
  - Evidence: —
  - Verification: MEMORY.md accurately reflects the current state

- [x] **T4.2**: Update `architecture.md` memory file (if it exists) — add debt dashboard and finding detail view to the component map. Note the schema consolidation.
  - Files: `/Users/rperaza/.claude/projects/-Users-rperaza-joicodev-ideas-kyro/memory/architecture.md`
  - Evidence: —
  - Verification: Architecture doc is current

### Phase 5 — Verification & Final Cleanup

**Objective**: Verify all changes compile, tests pass, and the project is in a clean state for 1.0.0.

**Tasks**:

- [x] **T5.1**: Run `tsc --noEmit` — verify zero compile errors after all changes
  - Files: —
  - Evidence: —
  - Verification: `npx tsc --noEmit` exits with code 0

- [x] **T5.2**: Run `vitest run` — verify all unit/integration tests pass with no regressions
  - Files: —
  - Evidence: —
  - Verification: All tests pass; zero failures

- [x] **T5.3**: Verify no remaining references to deleted components (`TaskDialog`, `MarkdownEditor`, `VersionHistory`) or removed schema (`SprintForgeSprintSchema`)
  - Files: —
  - Evidence: —
  - Verification: `grep -r` for deleted identifiers returns zero results (excluding sprint docs and build cache)

- [x] **T5.4**: Review the `components/editor/` directory — if empty after deletions, remove the directory
  - Files: `components/editor/` (potential DELETE)
  - Evidence: —
  - Verification: No empty directories left behind

---

## Emergent Phases

<!-- This section starts EMPTY. It is populated during sprint EXECUTION when new work is discovered. -->

---

## Findings Consolidation

<!-- This section is filled during sprint CLOSE. -->

| # | Finding | Origin Phase | Impact | Action Taken |
|---|---------|-------------|--------|-------------|
| 1 | `SprintForgeSprintSchema` only added 3 unique fields (`source`, `previousSprint`, `carryOverCount`, `executionDate`, `executedBy`) beyond what was already on the base — redundancy was worse than expected | Phase 1 (T1.1) | low | Folded unique fields into base SprintSchema and deleted the extended schema |
| 2 | `MarkdownToolbar` component was also orphaned in `components/editor/` — not just `MarkdownEditor` and `VersionHistory` | Phase 5 (T5.4) | low | Deleted entire `components/editor/` directory |
| 3 | Existing E2E tests (`activity-warning.spec.ts`) reference "Create Sprint" button that was removed in Sprint 4 — these tests are now broken | Phase 3 (T3.1) | medium | Updated `setupCommonRoutes` signature; existing tests need further updates for read-only UI (D12) |
| 4 | `setupCommonRoutes` helper returned projects without `sprints`/`documents` arrays, matching the pre-Sprint 4 bug in the actual API | Phase 3 (T3.1) | medium | Fixed helper to include `sprints` and `documents` in mock project data |

---

## Accumulated Technical Debt

| # | Item | Origin | Sprint Target | Status | Resolved In |
|---|------|--------|--------------|--------|-------------|
| D1 | Logo "Clever" hardcoded in sidebar | Pre-existing | product decision | open | — |
| D2 | Service factory always returns mock — switching logic pending | Pre-existing | Sprint 3 | resolved | Sprint 3 |
| D3 | Loading UI only in ContentRouter — sub-entities have no per-fetch states | Pre-existing | Sprint 4 | resolved | Sprint 4 |
| D4 | `parseSprintForgeFile()` recommendations section uses heuristic matching for heading | Sprint 1 Phase 3 | Sprint 3 | resolved | Sprint 3 |
| D5 | `FileProjectsService` and `CreateProjectInput` still use old `{id, name}` model — must be updated for registry `{path}` API | Sprint 2 Phase 5 | Sprint 3 | resolved | Sprint 3 |
| D6 | `addProject` in registry.ts throws unhandled error for duplicates — API route should catch and return 409 | Sprint 2 Phase 5 | Sprint 3 | resolved | Sprint 3 |
| D7 | UI components are read-only stubs — write operations replaced with no-ops/toasts pending Sprint 4 UI adaptation | Sprint 3 Emergent | Sprint 4 | resolved | Sprint 4 |
| D8 | `documents-page.tsx` still imports unused types (`Document`) and has dead code paths for edit/autosave | Sprint 3 Emergent | Sprint 4 | resolved | Sprint 4 |
| D9 | `SprintForgeSprintSchema` extends `SprintSchema` but now duplicates fields (`sprintType`, `phases`, `disposition`, etc.) that were promoted to the base schema | Sprint 4 Emergent | Sprint 5 | resolved | Sprint 5 |
| D10 | `TaskDialog` component still exists but is no longer used anywhere — dead code | Sprint 4 Phase 1 | Sprint 5 | resolved | Sprint 5 |
| D11 | `MarkdownEditor` and `VersionHistory` components may have no remaining consumers after documents/sprint-detail cleanup | Sprint 4 Phase 1 | Sprint 5 | resolved | Sprint 5 |
| D12 | Existing E2E tests (`activity-warning.spec.ts`) reference "Create Sprint" button removed in Sprint 4 — tests are broken for the read-only UI model | Sprint 5 Phase 3 | post-1.0.0 | open | — |

**Status values**: `open` | `in-progress` | `resolved` | `deferred` | `carry-over`

**Rules**:
- Never delete a row — only change status
- New items are appended at the bottom
- Inherited items keep their original numbers
- When resolved, fill "Resolved In" with the sprint number

---

## Definition of Done

- [x] `SprintForgeSprintSchema` consolidated into `SprintSchema` — no redundant extended schema (D9 resolved)
- [x] `TaskDialog`, `MarkdownEditor`, `VersionHistory` deleted — no orphaned components (D10, D11 resolved)
- [x] Findings page has drill-down detail view with full markdown, affected files, and recommendations
- [x] Debt dashboard page shows aggregated debt across all sprints with breakdown stats
- [x] NAV_ITEMS updated with Debt entry; routing wired in ContentRouter
- [x] E2E test fixture/helpers updated for sprint-forge data model
- [x] E2E tests created: navigation, sprint detail
- [x] `tsc --noEmit` passes with zero errors
- [x] `vitest run` passes with zero failures (102 tests)
- [x] No references to deleted components or schemas remain
- [x] MEMORY.md updated to reflect final architecture
- [x] No emergent phases needed
- [x] Accumulated debt table updated (D9, D10, D11 resolved; D12 added)
- [x] Retro section filled
- [x] Recommendations documented as post-1.0.0 items
- [x] Re-entry prompts updated

---

## Retro

<!-- Filled when the sprint is CLOSED. Do not fill during generation. -->

### What Went Well

- Schema consolidation was clean — `SprintForgeSprintSchema` only had 5 unique fields (`source`, `previousSprint`, `carryOverCount`, `executionDate`, `executedBy`) that folded neatly into the base
- All 3 orphaned components confirmed with zero import references — safe deletion with no cascading changes
- Findings detail view and debt dashboard implemented in single passes with no regressions
- The debt dashboard's deduplication-by-item-number approach naturally handles the sprint inheritance model
- All 102 unit/integration tests pass throughout; zero compile errors at every checkpoint
- All 5 Sprint 4 recommendations were directly incorporated — no deferrals

### What Didn't Go Well

- Existing E2E tests (`activity-warning.spec.ts`) were silently broken by Sprint 4's removal of "Create Sprint" UI — discovered only during Sprint 5's E2E work
- `MarkdownToolbar` was also orphaned but wasn't tracked as a debt item — the entire `components/editor/` directory needed cleanup

### Surprises / Unexpected Findings

- `setupCommonRoutes` E2E helper was also returning projects without `sprints`/`documents` arrays — mirroring the same bug that was fixed in the actual API during Sprint 4's hotfix
- The `SprintForgeMarkdownSectionsSchema` alias was also redundant and could be removed alongside the sprint schema consolidation

### New Technical Debt Detected

- D12: Existing E2E tests (`activity-warning.spec.ts`) reference "Create Sprint" button that no longer exists in the read-only UI

---

## Recommendations for Post-1.0.0

<!-- Since this is the final planned sprint, recommendations inform future feature work. -->

1. Fix or remove the broken E2E tests in `activity-warning.spec.ts` — they test a "Create Sprint" flow that no longer exists in the read-only model. Either rewrite them to test a different user action that triggers activity logging, or remove them entirely (resolves D12)
2. Add search/filter to the findings page — the list view would benefit from filtering by severity and text search as projects accumulate many findings
3. Add interactive dependency graph to the roadmap page — currently shows a flat list of sprint cards; a visual graph showing the `Sprint 1 → Sprint 2 → ...` chain would better communicate the dependency structure
4. Consider adding project-level settings (display name, color) editing UI — currently projects can only be configured during initial registration via AddProjectDialog
5. Add file-system watcher or polling to auto-refresh project data when sprint-forge files change on disk — currently requires manual page reload to see new content
