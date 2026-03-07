---
title: "Sprint 3 — Service Layer & Store Adaptation"
date: "2026-03-05"
updated: "2026-03-06"
project: "kyro-sprint-forge-reader"
type: "sprint-plan"
status: "completed"
version: "1.0"
sprint: 3
progress: 100
previous_doc: "[[SPRINT-2-project-registry-and-api-refactor]]"
next_doc: "[[SPRINT-4-ui-adaptation]]"
parent_doc: "[[ROADMAP]]"
agents:
  - "claude-opus-4-6"
tags:
  - "kyro-sprint-forge-reader"
  - "sprint-plan"
  - "sprint-3"
changelog:
  - version: "1.0"
    date: "2026-03-05"
    changes: ["Sprint generated and executed"]
related:
  - "[[ROADMAP]]"
  - "[[05-sprint-sections-expansion]]"
  - "[[06-roadmap-and-readme-parsing]]"
---

# Sprint 3 — Service Layer & Store Adaptation

> Source: `findings/05-sprint-sections-expansion.md`, `findings/06-roadmap-and-readme-parsing.md`
> Previous Sprint: `sprints/SPRINT-2-project-registry-and-api-refactor.md`
> Version Target: 0.4.0
> Type: refactor
> Carry-over: 0 items from previous sprint
> Execution Date: 2026-03-05
> Executed By: Claude

---

## Sprint Objective

Update the service layer contracts, file service implementations, and Zustand store to work with the registry-based project model from Sprint 2. After this sprint, `CreateProjectInput` will accept `{path}` instead of `{id, name}`, `FileProjectsService` will call the refactored API routes correctly, the store will have state for findings and roadmap data, `SprintMarkdownSections` will include all sprint-forge section keys, and the `SPRINT_SECTIONS` config will expose the expanded tabs. The service factory will properly switch between mock and file services.

---

## Disposition of Previous Sprint Recommendations

| # | Recommendation | Action | Where | Justification |
|---|---------------|--------|-------|---------------|
| 1 | Update `CreateProjectInput` to use `{ path: string; name?: string; color?: string }` | Incorporated | Phase 1, T1.1 | Direct alignment with POST /api/projects contract |
| 2 | Refactor `FileProjectsService.createProject()` to send `{path}` instead of `{id, name}` | Incorporated | Phase 2, T2.1 | Service must match the refactored API |
| 3 | Update service factory to switch between mock and file services based on `NEXT_PUBLIC_USE_MOCK_DATA` | Incorporated | Phase 2, T2.5 | Resolves D2 — factory already works, just needs verification and cleanup |
| 4 | Add proper error handling in `addProject` — return `WorkspaceError` with code `DUPLICATE_PROJECT` so API route can return 409 | Incorporated | Phase 2, T2.6 | Resolves D6 — improves API error responses |
| 5 | Update mock service's `createProject` to match the new interface for consistency | Incorporated | Phase 4, T4.1 | Mock and file services must share the same contract |

---

## Phases

### Phase 1 — Service Interface Update

**Objective**: Update service contracts and input types to match the registry-based API model. Add findings and roadmap service methods.

**Tasks**:

- [x] **T1.1**: Update `CreateProjectInput` — replace `{id, name, description?, readme?}` with `{path: string; name?: string; color?: string}`. Update `UpdateProjectInput` to `{name?: string; color?: string}` (no more description/readme writes).
  - Files: `lib/services/types.ts`
  - Evidence: —
  - Verification: Type-check passes; no compile errors in consumers

- [x] **T1.2**: Add `getFindings(projectId: string): Promise<Finding[]>` and `getRoadmap(projectId: string): Promise<{ raw: string; sprints: RoadmapSprintEntry[] }>` methods to `ProjectsService` interface
  - Files: `lib/services/types.ts`
  - Evidence: —
  - Verification: Interface requires these methods; implementations must provide them

- [x] **T1.3**: Remove write methods from `ProjectsService` that are no longer applicable for read-only sprint-forge directories: `createSprint`, `updateSprint`, `createTask`, `updateTask`, `moveTask`, `deleteTask`, `createDocument`, `updateDocument`, `deleteDocument`
  - Files: `lib/services/types.ts`
  - Evidence: —
  - Verification: Interface only has read + registry management methods

- [x] **T1.4**: Add `Finding` and `RoadmapSprintEntry` imports to `lib/services/types.ts`
  - Files: `lib/services/types.ts`
  - Evidence: —
  - Verification: Types imported from `@/lib/types`

### Phase 2 — File Service Implementation

**Objective**: Update `FileProjectsService` to use the refactored API routes and add findings/roadmap methods.

**Tasks**:

- [x] **T2.1**: Rewrite `FileProjectsService.createProject()` — send `{path, name?, color?}` to `POST /api/projects`
  - Files: `lib/services/file/projects.file.ts`
  - Evidence: —
  - Verification: Creates project via registry API; integration test passes

- [x] **T2.2**: Update `FileProjectsService.list()` — response now has registry-enriched projects (with `_available`, `_registryPath`); strip internal fields before returning
  - Files: `lib/services/file/projects.file.ts`
  - Evidence: —
  - Verification: List returns clean `Project[]` without internal metadata

- [x] **T2.3**: Add `FileProjectsService.getFindings(projectId)` — calls `GET /api/projects/{id}/findings`, returns `Finding[]`
  - Files: `lib/services/file/projects.file.ts`
  - Evidence: —
  - Verification: Returns parsed findings from external directory

- [x] **T2.4**: Add `FileProjectsService.getRoadmap(projectId)` — calls `GET /api/projects/{id}/roadmap`, returns `{raw, sprints}`
  - Files: `lib/services/file/projects.file.ts`
  - Evidence: —
  - Verification: Returns parsed roadmap data from external directory

- [x] **T2.5**: Remove obsolete write methods from `FileProjectsService`: `createSprint`, `updateSprint`, `deleteSprint`, `createTask`, `updateTask`, `moveTask`, `deleteTask`, `createDocument`, `updateDocument`, `deleteDocument`
  - Files: `lib/services/file/projects.file.ts`
  - Evidence: —
  - Verification: Class only implements read + registry management methods

- [x] **T2.6**: Add structured duplicate error handling — update `addProject()` in `registry.ts` to throw `WorkspaceError("DUPLICATE_PROJECT", ...)` instead of plain `Error`. Update `POST /api/projects` to catch and return 409.
  - Files: `lib/file-format/registry.ts`, `app/api/projects/route.ts`
  - Evidence: —
  - Verification: Duplicate registration returns HTTP 409 with structured error

### Phase 3 — Store Adaptation

**Objective**: Update the Zustand store to handle findings, roadmap, and the read-only project model. Remove write operations for sprint-forge data.

**Tasks**:

- [x] **T3.1**: Add `findings: Finding[]` and `activeFindings: Record<string, Finding[]>` state to the store. Add `loadFindings(projectId: string)` action that calls `services.projects.getFindings()`.
  - Files: `lib/store.ts`
  - Evidence: —
  - Verification: `loadFindings()` populates state; findings accessible by project ID

- [x] **T3.2**: Add `roadmaps: Record<string, { raw: string; sprints: RoadmapSprintEntry[] }>` state. Add `loadRoadmap(projectId: string)` action that calls `services.projects.getRoadmap()`.
  - Files: `lib/store.ts`
  - Evidence: —
  - Verification: `loadRoadmap()` populates state; roadmap accessible by project ID

- [x] **T3.3**: Update `addProject()` in store — send `{path, name?, color?}` via `services.projects.createProject()` instead of `{id, name, description}`. The store receives the full project from the API response.
  - Files: `lib/store.ts`
  - Evidence: —
  - Verification: Store `addProject` works with registry-based flow

- [x] **T3.4**: Remove store write operations that are no longer valid for read-only sprint-forge data: `addSprint`, `updateSprint`, `deleteSprint`, `addTask`, `updateTask`, `moveTask`, `deleteTask`, `addDocument`, `updateDocument`, `deleteDocument`, `updateReadme`, `updateSprintSection`
  - Files: `lib/store.ts`
  - Evidence: —
  - Verification: Store no longer has write methods for sprint-forge content

- [x] **T3.5**: Update `initializeApp()` — the `services.projects.list()` call now returns projects from the registry. No longer needs to fetch documents separately (documents come from the project's external dir via future API enhancement).
  - Files: `lib/store.ts`
  - Evidence: —
  - Verification: Init works with registry-based project list

### Phase 4 — Mock Service Update

**Objective**: Update mock service to match the new service interface with sprint-forge data patterns.

**Tasks**:

- [x] **T4.1**: Rewrite `MockProjectsService` to implement the updated `ProjectsService` interface: `list()`, `getProject()`, `createProject({path})`, `updateProject()`, `deleteProject()`, `getFindings()`, `getRoadmap()`
  - Files: `lib/services/mock/projects.mock.ts`
  - Evidence: —
  - Verification: Mock service implements all required methods; no unimplemented stubs

- [x] **T4.2**: Update `lib/mock-data.ts` — add sample sprint-forge-style data: projects with phases, findings array, roadmap summary, debt items. Remove internal-directory-style mock data.
  - Files: `lib/mock-data.ts`
  - Evidence: —
  - Verification: Mock data matches sprint-forge schema; `mockProjects` has phases, findings, etc.

### Phase 5 — Section Expansion & Config

**Objective**: Expand `SprintMarkdownSections` and `SPRINT_SECTIONS` config to include all sprint-forge sections.

**Tasks**:

- [x] **T5.1**: Expand `SprintMarkdownSectionsSchema` in `lib/types.ts` — add missing keys from `SprintForgeMarkdownSectionsSchema` into the base schema: `disposition`, `emergentPhases`, `definitionOfDone`, `sprintObjective`, `findingsConsolidation`. Remove or deprecate `executionMetrics` (not generated by sprint-forge).
  - Files: `lib/types.ts`
  - Evidence: —
  - Verification: Schema includes all sprint-forge section keys

- [x] **T5.2**: Update `SprintSectionMeta` type — change `key` field from `keyof SprintMarkdownSections` to include the expanded keys. Update `SPRINT_SECTIONS` config array with new entries for disposition, emergent phases, definition of done, sprint objective, findings consolidation.
  - Files: `lib/types.ts`, `lib/config.ts`
  - Evidence: —
  - Verification: `SPRINT_SECTIONS` has entries for all sprint-forge sections

- [x] **T5.3**: Add section icons for new section types in `SPRINT_SECTION_ICONS` and update `SprintSectionKey` type
  - Files: `lib/config.ts`
  - Evidence: —
  - Verification: All section keys have corresponding icons

- [x] **T5.4**: Wire up `extractSections()` in the sprint parsing pipeline — when `parseSprintForgeFile()` returns a sprint, the sections should be populated with extracted markdown for each section key
  - Files: `lib/file-format/sprint-forge-parsers.ts`
  - Evidence: —
  - Verification: Parsed sprint has populated `sections` with all available section content

### Phase 6 — Integration Tests

**Objective**: Verify the updated service layer, store, and section expansion work correctly end-to-end.

**Tasks**:

- [x] **T6.1**: Update `projects.file.integration.test.ts` — add tests for `getFindings()` and `getRoadmap()` via `FileProjectsService`
  - Files: `lib/services/file/__tests__/projects.file.integration.test.ts`
  - Evidence: —
  - Verification: Service methods return correct data from external sprint-forge directory

- [x] **T6.2**: Write unit tests for expanded `SprintMarkdownSections` and `SPRINT_SECTIONS` config — verify all section keys present, icons mapped
  - Files: `lib/file-format/__tests__/sprint-forge-parsers.test.ts`
  - Evidence: —
  - Verification: Section extraction populates all keys; config has correct entries

- [x] **T6.3**: Verify full test suite passes with no regressions
  - Files: —
  - Evidence: —
  - Verification: `vitest run` — all tests pass, zero failures

---

## Emergent Phases

### Emergent Phase — Component Compile Fix

**Objective**: Fix cascading compile errors in UI components caused by removed store write methods.

- [x] **TE.1**: Fix `lib/api/mappers/index.ts` — update `sprintFromDTO` section mapping from old 5-key model (`executionMetrics`, `findings`) to new 9-key model
  - Files: `lib/api/mappers/index.ts`, `lib/api/types.ts`
- [x] **TE.2**: Fix `app-sidebar.tsx` — update `addProject` call from `(Project)` to `(path, name?, color?)` signature; make it a placeholder pending Sprint 4 directory picker
  - Files: `components/app-sidebar.tsx`
- [x] **TE.3**: Fix `command-palette.tsx` — remove `addDocument`, `addSprint` store references; show info toasts for read-only operations
  - Files: `components/command-palette.tsx`
- [x] **TE.4**: Fix `documents-page.tsx` — remove `addDocument`, `updateDocument`, `deleteDocument` store references; make page read-only
  - Files: `components/pages/documents-page.tsx`
- [x] **TE.5**: Fix `readme-page.tsx` — remove `updateReadme` store reference; make page read-only
  - Files: `components/pages/readme-page.tsx`
- [x] **TE.6**: Fix `sprint-board.tsx` — remove `moveTask`, `addTask`, `updateTask`, `deleteTask` store references; make board read-only
  - Files: `components/pages/sprint-board.tsx`
- [x] **TE.7**: Fix `sprint-detail-page.tsx` — remove `updateSprintSection` and `placeholder` property references; make sections read-only
  - Files: `components/pages/sprint-detail-page.tsx`
- [x] **TE.8**: Fix `sprints-page.tsx` — remove `addSprint` store reference; make create a no-op
  - Files: `components/pages/sprints-page.tsx`

---

## Findings Consolidation

| # | Finding | Origin Phase | Impact | Action Taken |
|---|---------|-------------|--------|-------------|
| 1 | Removing store write methods causes cascading compile errors in 7 UI components | Phase 3 | high | Added Emergent Phase to fix all component compile errors before Phase 6 |
| 2 | API DTO section keys (`execution_metrics`, `findings`) were stale — never updated when domain schema expanded | Phase 5 | medium | Updated `SprintDTO.sections` and mapper to use new 9-key schema |
| 3 | `mock-data.ts` had duplicate `technicalDebt` keys after find-and-replace of `executionMetrics` | Phase 4 | low | Manually renamed to correct section keys (`findingsConsolidation`, `sprintObjective`) |

---

## Accumulated Technical Debt

| # | Item | Origin | Sprint Target | Status | Resolved In |
|---|------|--------|--------------|--------|-------------|
| D1 | Logo "Clever" hardcoded in sidebar | Pre-existing | product decision | open | — |
| D2 | Service factory always returns mock — switching logic pending | Pre-existing | Sprint 3 | resolved | Sprint 3 |
| D3 | Loading UI only in ContentRouter — sub-entities have no per-fetch states | Pre-existing | Sprint 4 | open | — |
| D4 | `parseSprintForgeFile()` recommendations section uses heuristic matching for heading | Sprint 1 Phase 3 | Sprint 3 | resolved | Sprint 3 |
| D5 | `FileProjectsService` and `CreateProjectInput` still use old `{id, name}` model — must be updated for registry `{path}` API | Sprint 2 Phase 5 | Sprint 3 | resolved | Sprint 3 |
| D6 | `addProject` in registry.ts throws unhandled error for duplicates — API route should catch and return 409 | Sprint 2 Phase 5 | Sprint 3 | resolved | Sprint 3 |
| D7 | UI components are read-only stubs — write operations replaced with no-ops/toasts pending Sprint 4 UI adaptation | Sprint 3 Emergent | Sprint 4 | open | — |
| D8 | `documents-page.tsx` still imports unused types (`Document`) and has dead code paths for edit/autosave | Sprint 3 Emergent | Sprint 4 | open | — |

**Status values**: `open` | `in-progress` | `resolved` | `deferred` | `carry-over`

**Rules**:
- Never delete a row — only change status
- New items are appended at the bottom
- Inherited items keep their original numbers
- When resolved, fill "Resolved In" with the sprint number

---

## Definition of Done

- [x] `CreateProjectInput` updated to `{path, name?, color?}` — matches POST /api/projects
- [x]`ProjectsService` interface has `getFindings()` and `getRoadmap()` methods
- [x]Write methods removed from `ProjectsService` (sprint-forge dirs are read-only)
- [x]`FileProjectsService` calls refactored API routes correctly
- [x]`FileProjectsService.getFindings()` and `getRoadmap()` implemented
- [x]Duplicate project registration returns HTTP 409
- [x]Store has `findings` and `roadmaps` state with load actions
- [x]Store write operations removed for sprint-forge content
- [x]`MockProjectsService` updated for new interface
- [x]`mock-data.ts` has sprint-forge-style sample data
- [x]`SprintMarkdownSections` expanded with all sprint-forge section keys
- [x]`SPRINT_SECTIONS` config updated with new tab entries and icons
- [x]`extractSections()` wired into sprint parsing pipeline
- [x]All unit tests pass (`vitest run`)
- [x]No regressions in existing tests
- [x]All emergent phase tasks completed (if any)
- [x]Accumulated debt table updated
- [x]Retro section filled
- [x]Recommendations for Sprint 4 documented
- [x]Re-entry prompts updated

---

## Retro

### What Went Well

- Service layer, store, and mock service rewrites went cleanly — all compile errors resolved in a single pass
- Section expansion (5 → 9 keys) was straightforward because the schema was well-structured in Sprint 1
- All 5 Sprint 2 recommendations were incorporated and addressed in the disposition table
- Integration tests from Sprint 2 continued to pass after service layer changes — no regressions
- 102 total tests passing with zero failures

### What Didn't Go Well

- Removing store write methods (Phase 3) caused cascading compile errors in 7 UI component files that weren't anticipated in the original plan
- The `lib/api/types.ts` DTO section keys were overlooked — they still had `execution_metrics` and `findings` after the domain schema was expanded
- Mock data `replace_all` of `executionMetrics` → `technicalDebt` created duplicate keys that required manual cleanup

### Surprises / Unexpected Findings

- UI components were tightly coupled to store write methods — removing write operations required touching all major page components
- The API DTO layer (`lib/api/types.ts`) has its own section schema that drifts independently from the domain types
- Making components read-only (no-ops/toasts) was the minimal fix, but leaves dead UI code paths (edit buttons, create dialogs) that Sprint 4 should clean up

### New Technical Debt Detected

- D7: UI components are read-only stubs — write operations replaced with no-ops/toasts
- D8: `documents-page.tsx` has dead code paths for edit/autosave functionality

---

## Recommendations for Sprint 4

1. Replace read-only stubs in UI components with proper read-only rendering — remove edit buttons, create dialogs, and drag-and-drop write handlers from sprint-board, documents-page, readme-page, sprints-page, and sprint-detail-page (resolves D7, D8)
2. Add project creation flow with directory picker dialog — replace the placeholder toast in `app-sidebar.tsx` and `command-palette.tsx` with a proper UI for registering external sprint-forge directories
3. Build the findings browser page (`components/pages/findings-page.tsx`) that consumes `store.findings` loaded via `loadFindings()` — display severity, affected files, and recommendations
4. Build the roadmap viewer page (`components/pages/roadmap-page.tsx`) that consumes `store.roadmaps` loaded via `loadRoadmap()` — display sprint summary table with dependencies and status
5. Add per-entity loading states for findings and roadmap (addresses D3 partially) — show skeletons while `loadFindings`/`loadRoadmap` are in-flight
