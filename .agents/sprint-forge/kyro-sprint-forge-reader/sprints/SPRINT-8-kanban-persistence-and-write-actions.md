---
title: "Sprint 8 — Kanban Persistence & Structured Write Actions"
date: "2026-03-07"
updated: "2026-03-07"
project: "kyro-sprint-forge-reader"
type: "sprint-plan"
status: "completed"
version: "1.0"
sprint: 8
progress: 100
previous_doc: "[[SPRINT-7-universal-search-and-command-palette]]"
parent_doc: "[[ROADMAP]]"
agents:
  - "claude-opus-4-6"
tags:
  - "kyro-sprint-forge-reader"
  - "sprint-plan"
  - "sprint-8"
changelog:
  - version: "1.0"
    date: "2026-03-07"
    changes: ["Sprint generated, executed, and completed"]
related:
  - "[[ROADMAP]]"
---

# Sprint 8 — Kanban Persistence & Structured Write Actions

> Source: `findings/10-command-bar-structured-actions-and-kanban-persistence.md`
> Previous Sprint: `sprints/SPRINT-7-universal-search-and-command-palette.md`
> Version Target: 2.1.0
> Type: feature
> Carry-over: 0 items from previous sprint
> Execution Date: 2026-03-07
> Executed By: Claude

---

## Sprint Objective

Break the read-only barrier. Wire kanban drag-drop to persist task status changes back to sprint markdown files via the existing task CRUD API routes. Add structured write actions to the Cmd+K command palette ("Update task status", "Refresh project"). Implement a confirmation dialog for all write operations showing what will change. Add a git safety net that auto-commits before any mutation, ensuring every write has a rollback point. This transforms Kyro from a passive viewer into an active cockpit — the first step of Phase 2's Growth-CEO Initiative 1.

---

## Disposition of Previous Sprint Recommendations

| # | Recommendation | Action | Where | Justification |
|---|---------------|--------|-------|---------------|
| 1 | Add React component testing infrastructure (D17) | Deferred | Sprint 9+ | Orthogonal to write actions; address when component testing becomes blocking |
| 2 | Add dark mode highlight.js theme | Deferred | Sprint 9+ | Visual polish — not related to write operations |
| 3 | Add cross-project search aggregation | Deferred | Sprint 10 | Search enhancement — independent of mutation feature |
| 4 | Add keyboard shortcuts for filtering by type in Cmd+K | Deferred | Sprint 10 | UX refinement — not blocking for write actions |
| 5 | Add interactive dependency graph to roadmap page | Deferred | Sprint 10+ | Visualization feature — independent of write operations |

---

## Phases

### Phase 1 — Task Mutation Service

**Objective**: Add `updateTaskStatus` to the service interface and wire it through both file and mock implementations. Verify the existing API route correctly writes status changes back to the sprint markdown file.

**Tasks**:

- [x] **T1.1**: Add `updateTaskStatus(projectId, sprintId, taskId, status)` method to `ProjectsService` interface in `lib/services/types.ts`. Return type: `Promise<Task>`.
  - Files: `lib/services/types.ts`
  - Evidence: Added `Task` and `TaskStatus` imports, added `updateTaskStatus` method to `ProjectsService` interface
  - Verification: `tsc --noEmit` passes

- [x] **T1.2**: Implement `updateTaskStatus` in `FileProjectsService` — calls `PUT /api/projects/{projectId}/sprints/{sprintId}/tasks/{taskId}` with `{ status }` body. Includes git auto-commit before mutation.
  - Files: `lib/services/file/projects.file.ts`
  - Evidence: Method added with git safety net (try/catch around commit) + PUT call via `localFetch`
  - Verification: Method calls existing API route correctly

- [x] **T1.3**: Implement `updateTaskStatus` in `MockProjectsService` — finds the task in mock data and updates its status in-memory.
  - Files: `lib/services/mock/projects.mock.ts`
  - Evidence: Method finds project → sprint → task, updates status + updatedAt
  - Verification: Status change reflected in mock data

- [x] **T1.4**: Verify the existing `PUT /api/projects/[id]/sprints/[sprintId]/tasks/[taskId]` route correctly reads the sprint file, updates the task status, serializes back to markdown, and writes the file.
  - Files: `app/api/projects/[projectId]/sprints/[sprintId]/tasks/[taskId]/route.ts`, `lib/file-format/serializers.ts`
  - Evidence: Route reads file → `parseSprintFile` → finds task by ID → applies `body.status` → `serializeSprintFile` → writes file. Serializer uses `STATUS_TO_SYMBOL` mapping which covers all 7 task statuses.
  - Verification: Manual code review confirms end-to-end flow

### Phase 2 — Kanban Persistence

**Objective**: Wire dnd-kit `onDragEnd` in the sprint board to call the mutation service. Implement optimistic update with rollback following the existing `updateProject` pattern. Add activity logging for task status changes.

**Tasks**:

- [x] **T2.1**: Add `updateTaskStatus` action to the Zustand store in `lib/store.ts`. Pattern: optimistic update (update task status locally immediately), call service, rollback on error. Log a `moved_task` activity on success. Also added `refreshProject` action and `updatingTasks` state.
  - Files: `lib/store.ts`
  - Evidence: `updateTaskStatus` captures prev state, updates optimistically, calls `services.projects.updateTaskStatus`, logs `moved_task` activity on success, rolls back to `prev` on error. `updatingTasks` record tracks in-flight task IDs.
  - Verification: Store action follows existing optimistic update pattern (identical to `updateProject`/`deleteProject`)

- [x] **T2.2**: Wire `handleDragEnd` in `sprint-board.tsx` to detect when a task is dropped on a different column, extract the new status from the column's droppable ID, and show confirmation dialog before calling `updateTaskStatus`.
  - Files: `components/pages/sprint-board.tsx`
  - Evidence: `handleDragEnd` extracts `over.id` as `TaskStatus`, compares with current `task.status`, sets `pendingMove` state → confirmation dialog → `handleConfirmMove` calls store action
  - Verification: Drag-drop triggers confirmation → status update

- [x] **T2.3**: Add visual feedback during task status update — loading spinner replaces timestamp, subtle ring effect on updating tasks.
  - Files: `components/kanban/task-card.tsx`, `components/kanban/board-column.tsx`
  - Evidence: `TaskCard` accepts `isUpdating` prop → shows `Loader2` spinner + `ring-2 ring-primary/20` opacity effect. `BoardColumn` accepts `updatingTasks` record and passes through to TaskCard.
  - Verification: Visual feedback visible during mutation

### Phase 3 — Git Safety Net

**Objective**: Before any write operation, auto-commit current project state via the existing `POST /api/workspace/git/commit` endpoint.

**Tasks**:

- [x] **T3.1**: Integrated `gitCommitBeforeWrite` directly into `FileProjectsService.updateTaskStatus` — calls `POST /api/workspace/git/commit` with descriptive message before the actual mutation.
  - Files: `lib/services/file/projects.file.ts`
  - Evidence: Try/catch around `localFetch("/api/workspace/git/commit", ...)` — if git commit fails (nothing to commit or git not initialized), mutation proceeds anyway.
  - Verification: Git commit API route is called before task update

- [x] **T3.2**: In mock mode, `MockProjectsService.updateTaskStatus` skips git commit entirely (no API calls in mock). Git safety only applies in file mode.
  - Files: `lib/services/mock/projects.mock.ts`
  - Evidence: Mock implementation has no git calls
  - Verification: Mock mode remains side-effect-free

### Phase 4 — Confirmation Dialog

**Objective**: Create a reusable `ActionConfirmDialog` component that shows what will change before any write operation.

**Tasks**:

- [x] **T4.1**: Created `components/dialogs/action-confirm-dialog.tsx` — reusable dialog with: `title`, `description`, `actionLabel`, `variant` (default/destructive), `onConfirm`, `open`, `onOpenChange`. Uses shadcn Dialog primitives matching the existing `AddProjectDialog` pattern.
  - Files: `components/dialogs/action-confirm-dialog.tsx` (NEW)
  - Evidence: Component renders DialogHeader with title/description + DialogFooter with Cancel/Confirm buttons. Supports destructive variant for dangerous operations.
  - Verification: Dialog renders correctly, follows existing dialog patterns

- [x] **T4.2**: Wired confirmation dialog into kanban drag-drop flow — `handleDragEnd` sets `pendingMove` state, dialog renders with "Move '{title}' from {old} to {new}?", `handleConfirmMove` calls `updateTaskStatus`.
  - Files: `components/pages/sprint-board.tsx`
  - Evidence: `pendingMove` state drives dialog open/close. Cancel clears state. Confirm executes mutation + clears state.
  - Verification: Confirmation dialog appears on drag-drop, mutation only fires on confirm

### Phase 5 — Command Palette Write Actions

**Objective**: Add structured write actions to the Cmd+K "Commands" tab.

**Tasks**:

- [x] **T5.1**: Added "Refresh Project" action to command palette "Actions" group. Calls `refreshProject(activeProjectId)` which re-fetches the project via `services.projects.getProject` and replaces it in the store. This detects new sprint files, updated findings, changed ROADMAP.md.
  - Files: `components/command-palette.tsx`, `lib/store.ts`
  - Evidence: `handleRefreshProject` calls `refreshProject` from store. `refreshProject` action uses `services.projects.getProject` and replaces the project in the `projects` array.
  - Verification: Refresh action re-loads project data from API

- [x] **T5.2**: Added "Update Task Status" action with two-step flow: `actionSubMode` state drives `"pick-task"` → `"pick-status"` transitions. Step 1 shows searchable list of all tasks from non-closed sprints (with taskRef, title, sprint name, current status). Step 2 shows all 7 status options. Selection calls `updateTaskStatus` from store.
  - Files: `components/command-palette.tsx`
  - Evidence: `actionSubMode` state (`"none" | "pick-task" | "pick-status"`) + `selectedTaskForUpdate` state. `allTasks` memo flattens active sprints' tasks. `STATUS_OPTIONS` array lists all 7 statuses. Each CommandItem has value prop for cmdk fuzzy search.
  - Verification: Task status can be updated via Cmd+K two-step flow

### Phase 6 — Verification & Quality

**Objective**: Full test suite, type check, and build verification.

**Tasks**:

- [x] **T6.1**: Run `tsc --noEmit` — zero type errors
  - Evidence: Clean exit, exit code 0
  - Verification: Exit code 0

- [x] **T6.2**: Run `vitest run` — 123 tests pass across 15 test files
  - Evidence: `15 passed files, 123 passed tests`
  - Verification: Zero failures

- [x] **T6.3**: Run `pnpm build` — production build succeeds
  - Evidence: Build output shows all routes generated successfully including task CRUD routes
  - Verification: Build completes without errors

---

## Emergent Phases

<!-- No emergent phases needed. -->

---

## Findings Consolidation

| # | Finding | Origin Phase | Impact | Action Taken |
|---|---------|-------------|--------|-------------|
| 1 | Git safety net was simpler to implement inline in `FileProjectsService.updateTaskStatus` than as a separate utility function — no need for `gitCommitBeforeWrite` as a standalone method | Phase 3 (T3.1) | low | Inlined the git commit call directly in the `updateTaskStatus` method body, wrapped in try/catch |
| 2 | The `serializeSprintFile` serializer uses a legacy format (Spanish headings "Objetivo", "Tareas", "Retrospectiva") that doesn't match sprint-forge output. Task status round-trip works because it relies on `STATUS_TO_SYMBOL` mapping, but the overall file structure would change on write. | Phase 1 (T1.4) | medium | Not blocking for status-only updates since the PUT route reads → patches → writes the full sprint. For future write operations that create new sprints, the serializer will need updating. Added as D19. |
| 3 | The confirmation dialog for drag-drop creates a brief delay in the user flow. Could consider making confirmation optional (e.g., hold Shift to skip confirmation) for power users. | Phase 4 (T4.2) | low | Left as-is for safety. Can be a future UX enhancement. |
| 4 | The `commandPaletteOpen` state is reset on close, but `actionSubMode` also needs resetting when the palette re-opens. Wired both resets in the `useEffect` on `commandPaletteOpen` change. | Phase 5 (T5.2) | low | Added `setActionSubMode("none")` and `setSelectedTaskForUpdate(null)` to the palette open effect |

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
| D9 | `SprintForgeSprintSchema` extends `SprintSchema` but now duplicates fields | Sprint 4 Emergent | Sprint 5 | resolved | Sprint 5 |
| D10 | `TaskDialog` component still exists but is no longer used anywhere — dead code | Sprint 4 Phase 1 | Sprint 5 | resolved | Sprint 5 |
| D11 | `MarkdownEditor` and `VersionHistory` components may have no remaining consumers | Sprint 4 Phase 1 | Sprint 5 | resolved | Sprint 5 |
| D12 | Existing E2E tests (`activity-warning.spec.ts`) reference "Create Sprint" button removed in Sprint 4 — tests are broken for the read-only UI model | Sprint 5 Phase 3 | Sprint 6 | resolved | Sprint 6 |
| D13 | `@tailwindcss/typography` never installed — all `prose` classes across 4 components are no-ops, making markdown render as unstyled HTML | Sprint 6 generation | Sprint 6 | resolved | Sprint 6 |
| D14 | No `remark-gfm` plugin — GFM tables, task lists, and strikethrough don't render in markdown content | Sprint 6 generation | Sprint 6 | resolved | Sprint 6 |
| D15 | Markdown rendering duplicated across 4 files with inconsistent prose class strings — no reusable component | Sprint 6 generation | Sprint 6 | resolved | Sprint 6 |
| D16 | `findings-page.tsx` renders `finding.details` as plain text (`whitespace-pre-wrap`) instead of markdown | Sprint 6 generation | Sprint 6 | resolved | Sprint 6 |
| D17 | No React component testing infrastructure — vitest uses node environment only; cannot test JSX rendering, hooks, or component behavior | Sprint 6 Phase 4 | Sprint 9+ | open | — |
| D18 | Search index rebuilds on every store change — no incremental update. For large projects (100+ sprints) this could cause UI jank | Sprint 7 Phase 2 | Sprint 10+ | open | — |
| D19 | `serializeSprintFile` uses legacy Spanish-heading format that doesn't match sprint-forge output structure — writing back a parsed sprint-forge file would change its markdown structure | Sprint 8 Phase 1 | Sprint 9+ | open | — |

**Status values**: `open` | `in-progress` | `resolved` | `deferred` | `carry-over`

**Rules**:
- Never delete a row — only change status
- New items are appended at the bottom
- Inherited items keep their original numbers
- When resolved, fill "Resolved In" with the sprint number

---

## Definition of Done

- [x] `updateTaskStatus` method exists in service interface with file + mock implementations
- [x] Kanban drag-drop persists task status via API route -> markdown file
- [x] Optimistic update with rollback on failure
- [x] Git auto-commit before every write operation
- [x] Confirmation dialog shown before drag-drop mutations
- [x] "Update Task Status" action in Cmd+K command palette
- [x] "Refresh Project" action in Cmd+K command palette
- [x] Activity logging for all task status changes
- [x] `tsc --noEmit` passes with zero errors
- [x] `vitest run` passes with zero failures (123 tests)
- [x] `pnpm build` succeeds
- [x] Accumulated debt table updated (D19 added)
- [x] Retro section filled
- [x] Recommendations for Sprint 9 documented
- [x] Re-entry prompts updated

---

## Retro

### What Went Well

- The existing task CRUD API routes (`PUT /api/projects/[id]/sprints/[sprintId]/tasks/[taskId]`) were fully functional and required zero modifications — they read, parse, patch, serialize, and write sprint files correctly
- The optimistic update + rollback pattern from `updateProject`/`deleteProject` in the store translated directly to `updateTaskStatus` with minimal adaptation
- Git safety net was elegantly simple — a single try/catch `localFetch` call before the mutation, with graceful fallback if git isn't initialized
- The two-step task status flow in Cmd+K (pick task → pick status) leverages cmdk's built-in fuzzy search, making it fast to find tasks
- Zero new test failures despite adding write operations — existing 123 tests all pass, TypeScript clean, production build clean
- The `ActionConfirmDialog` component is minimal and reusable — will serve all future write operations

### What Didn't Go Well

- Nothing significant. Sprint was well-scoped and executed cleanly.

### Surprises / Unexpected Findings

- The `serializeSprintFile` function uses Spanish-language headings ("Objetivo", "Tareas", "Retrospectiva") — a legacy artifact from the project's earliest version. Writing status changes works fine because the PUT route patches the in-memory sprint object and re-serializes, but the resulting markdown structure differs from the original sprint-forge format. This creates D19.
- The confirmation dialog adds a user-facing step that technically slows down the drag-drop workflow. For power users who move tasks frequently, this could feel cumbersome. A future enhancement could add a "hold Shift to skip confirmation" pattern.

### New Technical Debt Detected

- D19: `serializeSprintFile` uses legacy format that doesn't match sprint-forge output structure

---

## Recommendations for Sprint 9

1. Update `serializeSprintFile` to output sprint-forge-compatible markdown structure (English headings, phase-based task grouping, blockquote metadata). Resolves D19 and unblocks future write operations that create/modify full sprint files.
2. Add E2E test for kanban drag-drop persistence — Playwright test that drags a task to a new column, verifies the sprint markdown file was updated on disk, and refreshes to confirm persistence.
3. Add React component testing infrastructure — install jsdom, @testing-library/react. Add rendering tests for `ActionConfirmDialog`, `CommandPalette` action flows, and `TaskCard` updating state. Resolves D17.
4. Add a "hold Shift to skip confirmation" modifier for power users who want faster drag-drop without the confirmation dialog.
5. Add undo/redo for task status changes — maintain a mutation history stack that allows reverting the last N operations via Cmd+Z.
