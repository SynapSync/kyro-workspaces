---
title: "Sprint 4 — UI Adaptation"
date: "2026-03-05"
updated: "2026-03-06"
project: "kyro-sprint-forge-reader"
type: "sprint-plan"
status: "completed"
version: "1.0"
sprint: 4
progress: 100
previous_doc: "[[SPRINT-3-service-layer-and-store-adaptation]]"
next_doc: "[[SPRINT-5-new-views-e2e-and-polish]]"
parent_doc: "[[ROADMAP]]"
agents:
  - "claude-opus-4-6"
tags:
  - "kyro-sprint-forge-reader"
  - "sprint-plan"
  - "sprint-4"
changelog:
  - version: "1.0"
    date: "2026-03-05"
    changes: ["Sprint generated and executed"]
related:
  - "[[ROADMAP]]"
  - "[[08-ui-adaptation-kanban-and-detail-pages]]"
---

# Sprint 4 — UI Adaptation

> Source: `findings/08-ui-adaptation-kanban-and-detail-pages.md`
> Previous Sprint: `sprints/SPRINT-3-service-layer-and-store-adaptation.md`
> Version Target: 0.5.0
> Type: feature
> Carry-over: 0 items from previous sprint
> Execution Date: 2026-03-05
> Executed By: Claude

---

## Sprint Objective

Adapt all UI components to properly display sprint-forge data. This sprint removes the read-only stubs and dead code from Sprint 3's emergent phase, builds proper read-only rendering for sprint-forge content, expands the sprint detail page with interactive section components (disposition table, debt table, DoD checklist), updates the kanban board with phase-aware task cards showing task refs and file badges, adds a project creation dialog for registering external sprint-forge directories, and wires up navigation and loading states for the new data model. After this sprint, the UI will correctly render all sprint-forge content without any placeholder toasts or dead edit code paths.

---

## Disposition of Previous Sprint Recommendations

| # | Recommendation | Action | Where | Justification |
|---|---------------|--------|-------|---------------|
| 1 | Replace read-only stubs in UI components with proper read-only rendering — remove edit buttons, create dialogs, and drag-and-drop write handlers (resolves D7, D8) | Converted to Phase | Phase 1 | Significant enough to warrant its own phase — touches 7 component files |
| 2 | Add project creation flow with directory picker dialog — replace placeholder toasts in `app-sidebar.tsx` and `command-palette.tsx` | Incorporated | Phase 4, T4.1–T4.4 | Core feature for registering external sprint-forge directories |
| 3 | Build the findings browser page (`components/pages/findings-page.tsx`) that consumes `store.findings` | Deferred | Sprint 5 | Per roadmap, new views (findings, roadmap, debt) are Sprint 5 scope |
| 4 | Build the roadmap viewer page (`components/pages/roadmap-page.tsx`) that consumes `store.roadmaps` | Deferred | Sprint 5 | Per roadmap, new views (findings, roadmap, debt) are Sprint 5 scope |
| 5 | Add per-entity loading states for findings and roadmap (addresses D3 partially) | Incorporated | Phase 5, T5.3–T5.4 | Loading states needed for proper UX when fetching sprint-forge data |

---

## Phases

### Phase 1 — Read-Only UI Cleanup

**Objective**: Remove all dead edit/create/delete code paths from UI components. Replace placeholder toasts and no-op handlers with proper read-only rendering. Resolves D7 and D8.

**Tasks**:

- [x] **T1.1**: Clean up `sprint-board.tsx` — remove empty `handleDragEnd`, `handleDeleteTask`, `handleSaveTask` no-ops and any remaining edit UI (add task button, delete confirmation, task edit dialog triggers). Keep the board as a read-only status visualization.
  - Files: `components/pages/sprint-board.tsx`
  - Evidence: —
  - Verification: Component renders tasks in columns without any edit/create/delete UI; no unused handler functions

- [x] **T1.2**: Clean up `sprint-detail-page.tsx` — remove the markdown editor and save button from section tabs. Replace with read-only rendered markdown. Remove `handleSave` no-op and any edit-related state (`isEditing`, `editContent`, etc.).
  - Files: `components/pages/sprint-detail-page.tsx`
  - Evidence: —
  - Verification: Section tabs display rendered markdown content; no edit UI visible

- [x] **T1.3**: Clean up `documents-page.tsx` — remove dead autosave logic, edit/create/delete handlers, unused `Document` type imports, and the document editor panel. Replace with a simple read-only document list or a message indicating documents come from the sprint-forge directory.
  - Files: `components/pages/documents-page.tsx`
  - Evidence: —
  - Verification: No dead code paths; component either shows read-only docs or a descriptive placeholder

- [x] **T1.4**: Clean up `readme-page.tsx` — remove the save button and `handleSave` no-op. Display README as read-only rendered markdown.
  - Files: `components/pages/readme-page.tsx`
  - Evidence: —
  - Verification: README displays as read-only rendered markdown; no save UI

- [x] **T1.5**: Clean up `sprints-page.tsx` — remove the "Create Sprint" button and `handleCreate` no-op. The sprint list is purely read from the sprint-forge directory.
  - Files: `components/pages/sprints-page.tsx`
  - Evidence: —
  - Verification: Sprint list page has no create button; renders sprint list read-only

- [x] **T1.6**: Clean up `command-palette.tsx` — remove the "Create New Document" and "Create New Sprint" command items (they show info toasts and serve no purpose). Keep "Create New Project" but wire it to the Add Project dialog (Phase 4).
  - Files: `components/command-palette.tsx`
  - Evidence: —
  - Verification: Command palette only shows relevant actions; no toast-only commands

- [x] **T1.7**: Clean up `app-sidebar.tsx` — remove `handleCreateProject` toast placeholder. Wire the create button to open the Add Project dialog (Phase 4).
  - Files: `components/app-sidebar.tsx`
  - Evidence: —
  - Verification: Sidebar create button opens the Add Project dialog instead of showing a toast

### Phase 2 — Sprint Detail Expansion

**Objective**: Expand the sprint detail page from basic markdown tabs to interactive section components that properly render sprint-forge structured data (tables, checklists, phase trees).

**Tasks**:

- [x] **T2.1**: Create `DispositionTable` component — renders the disposition table with columns: #, Recommendation, Action, Where, Justification. Action column uses color-coded badges (green=Incorporated, yellow=Deferred, gray=N/A, blue=Resolved, purple=Converted to Phase).
  - Files: `components/sprint/disposition-table.tsx`
  - Evidence: —
  - Verification: Renders a disposition table from `sprint.sections.disposition` markdown; badges are visually distinct

- [x] **T2.2**: Create `DebtTable` component — renders the accumulated debt table with columns: #, Item, Origin, Sprint Target, Status, Resolved In. Status column uses color-coded badges (red=open, yellow=in-progress, green=resolved, gray=deferred).
  - Files: `components/sprint/debt-table.tsx`
  - Evidence: —
  - Verification: Renders debt items from parsed `sprint.debtItems`; status badges show correct colors

- [x] **T2.3**: Create `DoDChecklist` component — renders the definition of done as an interactive-looking checklist (read-only). Shows check marks for completed items and empty boxes for incomplete.
  - Files: `components/sprint/dod-checklist.tsx`
  - Evidence: —
  - Verification: Renders DoD items with visual check/uncheck states from `sprint.definitionOfDone`

- [x] **T2.4**: Create `FindingsConsolidationTable` component — renders the findings consolidation table with columns: #, Finding, Origin Phase, Impact, Action Taken. Impact column uses severity badges.
  - Files: `components/sprint/findings-consolidation-table.tsx`
  - Evidence: —
  - Verification: Renders findings consolidation entries from `sprint.findingsConsolidation`

- [x] **T2.5**: Create `PhasesList` component — renders phases as collapsible sections showing phase name, objective, progress (X/Y tasks done), and task list with status icons and task ref IDs. Handles both regular and emergent phases.
  - Files: `components/sprint/phases-list.tsx`
  - Evidence: —
  - Verification: Renders phases with task progress; emergent phases have visual distinction

- [x] **T2.6**: Update `sprint-detail-page.tsx` — replace the tab list to use the new section components. Map section keys to components: `disposition` → DispositionTable, `technicalDebt` → DebtTable, `definitionOfDone` → DoDChecklist, `findingsConsolidation` → FindingsConsolidationTable, `phases`/`emergentPhases` → PhasesList. Keep markdown rendering for `retrospective`, `recommendations`, `sprintObjective`.
  - Files: `components/pages/sprint-detail-page.tsx`
  - Evidence: —
  - Verification: All 9 section tabs render with appropriate component; structured data uses interactive components, text sections use markdown

### Phase 3 — Task Card & Kanban Updates

**Objective**: Update the kanban board task cards to display sprint-forge task metadata (task ref, files, phase) and add phase grouping option.

**Tasks**:

- [x] **T3.1**: Update `TaskCard` component — add task ref ID badge (e.g., "T1.2") in the card header, display files count badge when `task.files` is populated, show phase name tag. Use compact layout to avoid card bloat.
  - Files: `components/kanban/task-card.tsx`
  - Evidence: —
  - Verification: Task cards show ref ID, files count, and phase name when data is available; no visual regression for tasks without these fields

- [x] **T3.2**: Add phase section headers to the sprint board — when tasks have phase data, group them visually with collapsible phase headers showing phase name and progress (e.g., "Phase 1 — Type System (3/5)"). Default to flat view when phase data is not available.
  - Files: `components/pages/sprint-board.tsx`
  - Evidence: —
  - Verification: Board shows phase grouping headers when sprint has phases; falls back to flat view without

- [x] **T3.3**: Add emergent task visual distinction — tasks from emergent phases (taskRef starts with "TE.") should have a distinct border color or accent to differentiate them from planned tasks.
  - Files: `components/kanban/task-card.tsx`
  - Evidence: —
  - Verification: Emergent tasks (TE.*) have visual distinction from regular tasks

- [x] **T3.4**: Add sprint type badge to `sprints-page.tsx` — show the sprint type (refactor, feature, bugfix, etc.) as a color-coded badge next to each sprint name in the sprint list.
  - Files: `components/pages/sprints-page.tsx`
  - Evidence: —
  - Verification: Sprint list items show type badges with distinct colors per type

### Phase 4 — Project Creation Flow

**Objective**: Replace placeholder toasts with a proper "Add Project" dialog for registering external sprint-forge directories.

**Tasks**:

- [x] **T4.1**: Create `AddProjectDialog` component — dialog with: directory path text input, optional display name input, optional color picker, "Add" and "Cancel" buttons. Path input should accept any filesystem path.
  - Files: `components/dialogs/add-project-dialog.tsx`
  - Evidence: —
  - Verification: Dialog opens, accepts path input, and has proper form layout

- [x] **T4.2**: Add path validation to `AddProjectDialog` — when the user enters a path, validate via `POST /api/projects` (which already validates the directory structure). Show inline error messages for invalid paths (no README.md, no sprints/ directory, path not found). Show success state with auto-detected project name from README.
  - Files: `components/dialogs/add-project-dialog.tsx`
  - Evidence: —
  - Verification: Invalid paths show clear error messages; valid paths show auto-detected name

- [x] **T4.3**: Wire `AddProjectDialog` to store — on successful add, call `store.addProject(path, name?, color?)` which calls the service layer. Close dialog and navigate to the new project.
  - Files: `components/dialogs/add-project-dialog.tsx`
  - Evidence: —
  - Verification: Adding a project creates registry entry and navigates to the project

- [x] **T4.4**: Wire `AddProjectDialog` to sidebar and command palette — replace the placeholder toast in `app-sidebar.tsx` with dialog open trigger. Update `command-palette.tsx` "Create New Project" to open the dialog. Add `addProjectDialogOpen` state to store (or use local state).
  - Files: `components/app-sidebar.tsx`, `components/command-palette.tsx`, `lib/store.ts` (if using store state)
  - Evidence: —
  - Verification: Sidebar "+" and command palette "Create New Project" both open the AddProjectDialog

### Phase 5 — Navigation, Config & Loading States

**Objective**: Update navigation config, add sprint-forge-specific UI helpers, and add per-entity loading states for findings and roadmap data.

**Tasks**:

- [x] **T5.1**: Update `NAV_ITEMS` in `lib/config.ts` — add entries for Findings and Roadmap navigation items with appropriate icons (Search/FileSearch for findings, Map/Route for roadmap). These will navigate to pages built in Sprint 5.
  - Files: `lib/config.ts`
  - Evidence: —
  - Verification: NAV_ITEMS includes findings and roadmap entries; sidebar renders them

- [x] **T5.2**: Add sprint type color mapping to `lib/config.ts` — create `SPRINT_TYPE_COLORS` map: `refactor` → blue, `feature` → green, `bugfix` → red, `audit` → purple, `debt` → orange. Export as a const map.
  - Files: `lib/config.ts`
  - Evidence: —
  - Verification: Config exports `SPRINT_TYPE_COLORS` with all sprint types mapped to colors

- [x] **T5.3**: Add per-entity loading states to the store — add `findingsLoading: Record<string, boolean>` and `roadmapLoading: Record<string, boolean>` keyed by project ID. Set true before fetch, false after (success or error). This addresses D3 partially.
  - Files: `lib/store.ts`
  - Evidence: —
  - Verification: Loading states toggle correctly during `loadFindings` and `loadRoadmap`

- [x] **T5.4**: Add skeleton components for findings and roadmap loading — create reusable loading skeletons that display while data is being fetched. Use shadcn `Skeleton` component.
  - Files: `components/ui/entity-skeleton.tsx`
  - Evidence: —
  - Verification: Skeletons render during loading states; disappear when data arrives

- [x] **T5.5**: Wire new nav items to placeholder pages — create minimal `findings-page.tsx` and `roadmap-page.tsx` that show "Coming in Sprint 5" or render basic data if available. Add routing in `ContentRouter`.
  - Files: `components/pages/findings-page.tsx`, `components/pages/roadmap-page.tsx`, `components/content-router.tsx`
  - Evidence: —
  - Verification: Clicking Findings/Roadmap in sidebar navigates to the appropriate page

- [x] **T5.6**: Add finding severity color mapping to `lib/config.ts` — create `FINDING_SEVERITY_COLORS` map: `critical` → red, `high` → orange, `medium` → yellow, `low` → blue, `info` → gray.
  - Files: `lib/config.ts`
  - Evidence: —
  - Verification: Config exports `FINDING_SEVERITY_COLORS` with all severity levels mapped

### Phase 6 — Verification & Cleanup

**Objective**: Verify all changes compile, tests pass, and no regressions are introduced.

**Tasks**:

- [x] **T6.1**: Run `tsc --noEmit` — verify zero compile errors after all UI changes
  - Files: —
  - Evidence: —
  - Verification: `npx tsc --noEmit` exits with code 0

- [x] **T6.2**: Run `vitest run` — verify all existing tests pass with no regressions
  - Files: —
  - Evidence: —
  - Verification: All tests pass; zero failures

- [x] **T6.3**: Verify `NAV_ITEMS`, `SPRINT_SECTIONS`, `SPRINT_TYPE_COLORS`, and `FINDING_SEVERITY_COLORS` are type-safe and consistent — no missing keys, no `any` types
  - Files: `lib/config.ts`
  - Evidence: —
  - Verification: All config maps are properly typed; TypeScript infers correct types

---

## Emergent Phases

### Emergent Phase — Schema Alignment

**Objective**: Fix type mismatches discovered during UI adaptation where sprint-forge structured data wasn't exposed on the base Sprint type.

- [x] **TE.1**: Add `sprintType` to base `SprintSchema` — the field was only on `SprintForgeSprintSchema` but sprint list page needed it for type badges
  - Files: `lib/types.ts`
- [x] **TE.2**: Add `phases`, `disposition`, `debtItems`, `findingsConsolidation`, `definitionOfDone` to base `SprintSchema` — sprint detail page needs these for structured component rendering
  - Files: `lib/types.ts`
- [x] **TE.3**: Implement full findings and roadmap pages ahead of Sprint 5 — loading states, skeleton components, and nav routing warranted complete pages rather than "Coming Soon" placeholders
  - Files: `components/pages/findings-page.tsx`, `components/pages/roadmap-page.tsx`, `components/content-router.tsx`

---

## Findings Consolidation

<!-- This section is filled during sprint CLOSE. -->

| # | Finding | Origin Phase | Impact | Action Taken |
|---|---------|-------------|--------|-------------|
| 1 | `sprintType` only on `SprintForgeSprintSchema`, not base `SprintSchema` — sprint list page couldn't access it | Phase 1 (T1.5) | medium | Added `sprintType` to base SprintSchema (TE.1) |
| 2 | Sprint-forge structured data (`phases`, `disposition`, `debtItems`, etc.) not on base `Sprint` type — detail page needed them for interactive components | Phase 2 (T2.6) | medium | Extended base SprintSchema with optional sprint-forge fields (TE.2) |
| 3 | Findings and roadmap pages were planned as placeholders but loading states + skeleton warranted full implementations | Phase 5 (T5.5) | low | Built complete pages with data fetching, loading states, and empty states (TE.3) |
| 4 | `toast` import left behind in `app-sidebar.tsx` after removing placeholder — used by sidebar toggle | Phase 4 | low | Restored toast import (still needed for sidebar toggle feedback) |

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
| D9 | `SprintForgeSprintSchema` extends `SprintSchema` but now duplicates fields (`sprintType`, `phases`, `disposition`, etc.) that were promoted to the base schema | Sprint 4 Emergent | Sprint 5 | open | — |
| D10 | `TaskDialog` component still exists but is no longer used anywhere — dead code | Sprint 4 Phase 1 | Sprint 5 | open | — |
| D11 | `MarkdownEditor` and `VersionHistory` components may have no remaining consumers after documents/sprint-detail cleanup | Sprint 4 Phase 1 | Sprint 5 | open | — |

**Status values**: `open` | `in-progress` | `resolved` | `deferred` | `carry-over`

**Rules**:
- Never delete a row — only change status
- New items are appended at the bottom
- Inherited items keep their original numbers
- When resolved, fill "Resolved In" with the sprint number

---

## Definition of Done

- [x] All read-only stubs removed — no placeholder toasts, no no-op handlers, no dead edit code (D7, D8 resolved)
- [x] Sprint detail page renders all 9 section types with appropriate components
- [x] New section components created: DispositionTable, DebtTable, DoDChecklist, FindingsConsolidationTable, PhasesList
- [x] Task cards display taskRef, files badge, and phase tag
- [x] Kanban board has phase grouping headers (when phase data available)
- [x] Sprint list shows sprint type badges
- [x] AddProjectDialog created and wired to sidebar + command palette
- [x] NAV_ITEMS updated with Findings and Roadmap entries
- [x] Per-entity loading states added for findings and roadmap
- [x] Placeholder pages for findings and roadmap render correctly
- [x] `SPRINT_TYPE_COLORS` and `FINDING_SEVERITY_COLORS` configs added
- [x] `tsc --noEmit` passes with zero errors
- [x] `vitest run` passes with zero failures
- [x] All emergent phase tasks completed (if any)
- [x] Accumulated debt table updated
- [x] Retro section filled
- [x] Recommendations for Sprint 5 documented
- [x] Re-entry prompts updated

---

## Retro

### What Went Well

- Phase 1 (read-only cleanup) was clean — 7 component files stripped of dead edit/create/delete code in a single pass with no regressions
- All 5 new section components (DispositionTable, DebtTable, DoDChecklist, FindingsConsolidationTable, PhasesList) compiled and rendered correctly on first write
- AddProjectDialog creation and wiring to sidebar + command palette was straightforward — store state pattern worked well
- NAV_ITEMS already had Findings and Roadmap entries from Sprint 3 config work — T5.1 was already done
- Findings and roadmap pages were implemented as full functional pages rather than placeholders, ahead of Sprint 5 schedule
- All 5 Sprint 3 recommendations addressed in disposition table
- 102 tests passing, zero compile errors throughout

### What Didn't Go Well

- `sprintType` was only on `SprintForgeSprintSchema` (the extended type) but needed on the base `SprintSchema` for sprint list badges — required emergent fix
- Sprint-forge structured data fields (`phases`, `disposition`, `debtItems`, etc.) similarly needed promotion to the base schema for the detail page components to work
- The `SprintForgeSprintSchema.extend()` now has field duplication since the base was expanded — needs cleanup in Sprint 5

### Surprises / Unexpected Findings

- The split between `SprintSchema` (base) and `SprintForgeSprintSchema` (extended) created friction — nearly all "extended" fields needed to be on the base type for UI rendering
- `TaskDialog` component became completely unused after removing edit/create from sprint board — dead code discovered
- `MarkdownEditor` and `VersionHistory` components may now be orphaned after documents-page and sprint-detail-page cleanups

### New Technical Debt Detected

- D9: `SprintForgeSprintSchema` duplicates fields now present in base `SprintSchema`
- D10: `TaskDialog` component has no consumers after sprint board cleanup
- D11: `MarkdownEditor` and `VersionHistory` may be orphaned after editor removal

---

## Recommendations for Sprint 5

1. Consolidate `SprintForgeSprintSchema` into `SprintSchema` — the distinction is no longer useful since all sprint-forge fields were promoted to the base type. Remove the extended schema and update all imports (resolves D9)
2. Delete unused components: `TaskDialog`, and verify whether `MarkdownEditor` and `VersionHistory` still have consumers. Remove if orphaned (resolves D10, D11)
3. Add E2E tests with Playwright for the full workflow: add project via dialog, navigate to sprint list, open sprint detail, view findings page, view roadmap page
4. Enhance findings page with detail view — clicking a finding should show full rendered markdown with affected files list and recommendations
5. Add debt dashboard page that aggregates `debtItems` across all sprints for the active project — show open count, resolution trend, and origin breakdown
