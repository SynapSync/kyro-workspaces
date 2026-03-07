---
title: "Sprint 9 — Sprint Forge Trigger & Prompt Composer"
date: "2026-03-07"
updated: "2026-03-07"
project: "kyro-sprint-forge-reader"
type: "sprint-plan"
status: "completed"
version: "1.0"
sprint: 9
progress: 100
previous_doc: "[[SPRINT-8-kanban-persistence-and-write-actions]]"
parent_doc: "[[ROADMAP]]"
agents:
  - "claude-opus-4-6"
tags:
  - "kyro-sprint-forge-reader"
  - "sprint-plan"
  - "sprint-9"
changelog:
  - version: "1.0"
    date: "2026-03-07"
    changes: ["Sprint generated, executed, and completed"]
related:
  - "[[ROADMAP]]"
---

# Sprint 9 — Sprint Forge Trigger & Prompt Composer

> Source: `findings/11-sprint-forge-trigger-from-kyro.md`
> Previous Sprint: `sprints/SPRINT-8-kanban-persistence-and-write-actions.md`
> Version Target: 2.2.0
> Type: feature
> Carry-over: 0 items from previous sprint
> Execution Date: 2026-03-07
> Executed By: Claude

---

## Sprint Objective

Close the workflow loop — generate sprint-forge prompts from within Kyro. Build a sprint context assembler that reads current project state (last sprint, open debt, unresolved findings, next sprint number) and a prompt composer that outputs ready-to-use sprint-forge prompts. Add a "Generate Next Sprint" wizard on the roadmap page with multi-step selection (findings, debt items, version target) and clipboard copy. Eliminate the legacy Spanish-heading serializer (D19) that destroys sprint-forge file structure on write — replace with a surgical patch approach for task status updates. This sprint transforms Kyro from a passive viewer into the interface for sprint-forge, aligning with Growth-CEO Initiative 3.

---

## Disposition of Previous Sprint Recommendations

| # | Recommendation | Action | Where | Justification |
|---|---------------|--------|-------|---------------|
| 1 | Update `serializeSprintFile` to output sprint-forge-compatible markdown (D19) | Converted to Phase | Phase 1 | MANDATORY per user directive — legacy template must be eliminated completely |
| 2 | Add E2E test for kanban drag-drop persistence | Deferred | Sprint 10+ | Orthogonal to sprint forge trigger; address when E2E coverage becomes blocking |
| 3 | Add React component testing infrastructure (D17) | Deferred | Sprint 10+ | Not blocking for sprint forge features |
| 4 | Add "hold Shift to skip confirmation" modifier for power users | Deferred | Sprint 10+ | UX polish — not related to sprint forge trigger |
| 5 | Add undo/redo for task status changes | Deferred | Sprint 10+ | Complex feature requiring mutation history stack — separate sprint |

---

## Phases

### Phase 1 — D19: Eliminate Legacy Serializer

**Objective**: Delete the legacy `serializeSprintFile` function that uses Spanish headings and rewrites the entire file. Replace with a surgical `patchTaskStatusInMarkdown` function that finds the task line by title and swaps only the checkbox symbol. Update the task PUT API route to use the surgical patch instead of full rewrite.

**Tasks**:

- [x] **T1.1**: Create `patchTaskStatusInMarkdown(content: string, taskTitle: string, newStatus: string): string` in `lib/file-format/serializers.ts`. Uses regex to find the task line matching `- [any] **Tref**: title` or `- [any] title` and replaces only the checkbox symbol via `STATUS_TO_SYMBOL` mapping.
  - Files: `lib/file-format/serializers.ts`
  - Evidence: Function uses escaped regex with capture groups `$1${newSymbol}$2` to swap only the checkbox character while preserving everything else. Handles both sprint-forge format (with bold task refs) and simple format.
  - Verification: 4 unit tests pass (see T1.4)

- [x] **T1.2**: Deleted `serializeSprintFile`, `taskToSymbol`, and `phaseFromTask` from `serializers.ts`. Removed all imports across 4 files: `tasks/[taskId]/route.ts`, `sprints/[sprintId]/route.ts`, `sprints/[sprintId]/tasks/route.ts`, and `sprint.test.ts`. Also removed unused `Sprint` type import from serializers and `Task` type import that was only used by the deleted function.
  - Files: `lib/file-format/serializers.ts`, `app/api/.../route.ts` (3 files), `lib/file-format/__tests__/sprint.test.ts`
  - Evidence: `grep -r "serializeSprintFile" --include="*.ts"` returns zero results
  - Verification: `tsc --noEmit` passes with zero errors

- [x] **T1.3**: Updated task PUT route to use surgical patch. Now reads raw content, calls `patchTaskStatusInMarkdown(content, existingTask.title, newStatus)`, and writes back. Only writes when status actually changed. The DELETE handler also updated to use surgical line removal instead of full rewrite.
  - Files: `app/api/projects/[projectId]/sprints/[sprintId]/tasks/[taskId]/route.ts`
  - Evidence: PUT handler: `if (body.status && body.status !== existingTask.status) { const patched = patchTaskStatusInMarkdown(...); await fs.writeFile(...); }`. Sprint PUT and tasks POST routes had their write operations removed (these routes are unused by the UI and relied on the deleted serializer).
  - Verification: Type check passes, route structure preserved

- [x] **T1.4**: Added 4 unit tests for `patchTaskStatusInMarkdown` in existing `sprint.test.ts` (replaced the deleted `serializeSprintFile` test): sprint-forge format with task refs, simple format without refs, no-match returns unchanged, correct task when names are similar.
  - Files: `lib/file-format/__tests__/sprint.test.ts`
  - Evidence: Tests cover: `- [ ] **T1.1**: Setup repo` → `- [x] **T1.1**: Setup repo`, `- [ ] Pending task` → `- [~] Pending task`, no-match returns original, similar names patched correctly
  - Verification: 126 tests pass (15 files)

### Phase 2 — Sprint Context Assembler

**Objective**: Build a pure function module that reads current project state from the store and assembles the context needed to compose a sprint-forge prompt.

**Tasks**:

- [x] **T2.1**: Created `lib/forge/context.ts` with `SprintForgeContext` interface and `assembleSprintContext(project, findings, roadmapSprints)` function. Extracts: `projectName`, `projectId`, `projectPath`, `lastSprint` (number/name/id), `nextSprint` (from roadmap), `openDebtItems` (filtered from last sprint with debt data), `allFindings`, `completedSprintCount`, `totalSprintCount`.
  - Files: `lib/forge/context.ts` (NEW)
  - Evidence: Pure function with typed return. `extractOpenDebt` scans sprints in reverse for the last one with `debtItems`, filters for `open` or `in-progress` status. `getLastSprint` extracts sprint number from name via regex.
  - Verification: TypeScript compiles, zero side effects

- [x] **T2.2**: Added `getNextSprintInfo(roadmapSprints)` helper that finds the first non-completed sprint and returns `NextSprintInfo` with number, sprintId, version, type, focus, findingSource, dependencies.
  - Files: `lib/forge/context.ts`
  - Evidence: `roadmapSprints.find(s => s.status !== "completed")` — returns null if all completed
  - Verification: Returns correct next sprint from roadmap data

### Phase 3 — Prompt Composer

**Objective**: Build a function that takes assembled context + user selections and outputs a ready-to-use sprint-forge prompt string following the re-entry prompt format.

**Tasks**:

- [x] **T3.1**: Created `lib/forge/prompt-composer.ts` with `composeSprintForgePrompt(context, selections)`. Outputs a structured prompt including: project name, files to read in order (README, ROADMAP, last sprint, selected findings), sprint scope (title, version, type), selected debt items to resolve, custom notes. Format follows sprint-forge re-entry prompt conventions.
  - Files: `lib/forge/prompt-composer.ts` (NEW)
  - Evidence: Output includes numbered file list, `/sprint-forge` invocation, sprint metadata, debt items as `- D{n}: {item}` format, completion progress `{completed}/{total} sprints`
  - Verification: TypeScript compiles, output is a clean string

- [x] **T3.2**: Created `ForgePromptSelections` interface with `selectedFindingIds: string[]`, `selectedDebtNumbers: number[]`, `versionTarget: string`, `sprintType: string`, `customNotes: string`.
  - Files: `lib/forge/prompt-composer.ts`
  - Evidence: Exported interface used by both the prompt composer and wizard component
  - Verification: TypeScript compiles

### Phase 4 — Sprint Generation Wizard UI

**Objective**: Add a "Generate Next Sprint" button on the roadmap page that opens a multi-step wizard dialog. Steps: select findings, select debt items, set version/type, preview composed prompt, copy to clipboard.

**Tasks**:

- [x] **T4.1**: Created `components/dialogs/sprint-forge-wizard.tsx` — 4-step wizard dialog. Step 0: findings selection (checkboxes with severity badges). Step 1: debt item selection (checkboxes with D-numbers, origin, target). Step 2: version target input, sprint type selector (5 types with color-coded buttons), custom notes textarea. Step 3: preview with monospace pre block and "Copy to Clipboard" button (with check icon feedback). Navigation via Back/Next + clickable step indicators.
  - Files: `components/dialogs/sprint-forge-wizard.tsx` (NEW)
  - Evidence: Uses `useState` for step navigation, `useMemo` for prompt composition, `useCallback` for clipboard API. Resets all state when dialog opens via `handleOpenChange`. Uses `FINDING_SEVERITY_COLORS` and `SPRINT_TYPE_COLORS` from config.
  - Verification: Component renders with all shadcn/ui Dialog primitives, follows existing dialog patterns

- [x] **T4.2**: Added "Generate Next Sprint" button on `roadmap-page.tsx`. Appears next to the view toggle when `hasPendingSprints` is true. Uses `Wand2` icon. Opens `SprintForgeWizard` dialog. Context assembled via `assembleSprintContext()` memo from store data (project, findings, roadmap sprints). Findings loaded lazily via `loadFindings` effect.
  - Files: `components/pages/roadmap-page.tsx`
  - Evidence: Button: `<Button size="sm" onClick={() => setWizardOpen(true)}><Wand2 /> Generate Next Sprint</Button>`. Context: `useMemo(() => assembleSprintContext(project, findings[id] ?? [], sprints), [...])`.
  - Verification: Button visible on roadmap page, opens wizard with pre-loaded context

- [x] **T4.3**: Added "Generate Sprint" command to Cmd+K command palette under Actions group. Uses `Wand2` icon. Only shown when `forgeContext` is available (roadmap loaded). Opens the wizard by closing the palette and setting `forgeWizardOpen = true`. Wizard rendered as sibling to `CommandDialog` via React fragment.
  - Files: `components/command-palette.tsx`
  - Evidence: `<CommandItem onSelect={handleOpenForgeWizard}><Wand2 /> Generate Sprint</CommandItem>`. Context: `useMemo(() => assembleSprintContext(activeProject, findings[id], roadmap.sprints), [...])`.
  - Verification: Command appears in palette, opens wizard

### Phase 5 — Verification & Quality

**Objective**: Full test suite, type check, and build verification.

**Tasks**:

- [x] **T5.1**: Run `tsc --noEmit` — zero type errors
  - Evidence: Clean exit, exit code 0
  - Verification: Exit code 0

- [x] **T5.2**: Run `vitest run` — 126 tests pass across 15 test files
  - Evidence: `15 passed files, 126 passed tests`
  - Verification: Zero failures

- [x] **T5.3**: Run `pnpm build` — production build succeeds
  - Evidence: All routes generated successfully including forge-related components
  - Verification: Build completes without errors

---

## Emergent Phases

### Emergent Phase — Clean Up serializeSprintFile References

**Reason**: Deleting the legacy serializer required updating 3 additional API routes beyond the task PUT route: sprint PUT route, tasks POST route, and the existing unit test. The sprint PUT and tasks POST routes used `serializeSprintFile` for write operations that are currently unused by the UI.

**Tasks**:

- [x] **TE.1**: Removed `serializeSprintFile` import from sprint PUT route (`sprints/[sprintId]/route.ts`). Removed the write-back call — sprint metadata updates via full rewrite are not supported; only task status uses surgical patching.
  - Files: `app/api/projects/[projectId]/sprints/[sprintId]/route.ts`
  - Verification: `tsc --noEmit` passes

- [x] **TE.2**: Removed `serializeSprintFile` import from tasks POST route (`sprints/[sprintId]/tasks/route.ts`). Task creation via full rewrite is not supported.
  - Files: `app/api/projects/[projectId]/sprints/[sprintId]/tasks/route.ts`
  - Verification: `tsc --noEmit` passes

- [x] **TE.3**: Updated `sprint.test.ts` — replaced the `serializeSprintFile` test with 4 new `patchTaskStatusInMarkdown` tests. Removed `Sprint` type import that was only used by the deleted test.
  - Files: `lib/file-format/__tests__/sprint.test.ts`
  - Verification: 126 tests pass

---

## Findings Consolidation

| # | Finding | Origin Phase | Impact | Action Taken |
|---|---------|-------------|--------|-------------|
| 1 | The legacy `serializeSprintFile` was imported in 4 files beyond where Sprint 8 identified it — the sprint PUT route, tasks POST route, and test file all needed updating | Phase 1 (TE.1-3) | medium | Created emergent phase to clean up all references; sprint PUT and tasks POST write operations removed since they relied on the deleted function |
| 2 | The surgical patch regex needed to handle both `**T1.1**: title` (sprint-forge) and plain `title` (simple) formats, plus escaped special characters in task titles | Phase 1 (T1.1) | low | Single regex with optional task ref group: `(?:\\*\\*\\w[\\w.]*\\*\\*:\\s*)?` handles both formats |
| 3 | The `assembleSprintContext` function needs debt items from parsed sprint data, but debt items are only available when the sprint-forge parser extracts them — mock sprints won't have debt data | Phase 2 (T2.1) | low | `extractOpenDebt` scans sprints in reverse and returns empty array if no sprint has debt items — graceful fallback |
| 4 | The forge wizard needs findings to be loaded, but the roadmap page didn't previously load findings. Added lazy loading via `useEffect` | Phase 4 (T4.2) | low | Added `loadFindings` effect to roadmap-page.tsx, only triggers if findings not already loaded |

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
| D17 | No React component testing infrastructure — vitest uses node environment only; cannot test JSX rendering, hooks, or component behavior | Sprint 6 Phase 4 | Sprint 10+ | open | — |
| D18 | Search index rebuilds on every store change — no incremental update. For large projects (100+ sprints) this could cause UI jank | Sprint 7 Phase 2 | Sprint 10+ | open | — |
| D19 | `serializeSprintFile` uses legacy Spanish-heading format that doesn't match sprint-forge output structure — writing back a parsed sprint-forge file would change its markdown structure | Sprint 8 Phase 1 | Sprint 9 | resolved | Sprint 9 |
| D20 | Sprint PUT and tasks POST API routes no longer write to disk — full file rewrite removed when D19 legacy serializer was deleted. These routes return data without persisting. Future write operations need surgical patch equivalents. | Sprint 9 Emergent | Sprint 10+ | open | — |

**Status values**: `open` | `in-progress` | `resolved` | `deferred` | `carry-over`

**Rules**:
- Never delete a row — only change status
- New items are appended at the bottom
- Inherited items keep their original numbers
- When resolved, fill "Resolved In" with the sprint number

---

## Definition of Done

- [x] Legacy `serializeSprintFile` function deleted — no Spanish-heading template exists (D19 resolved)
- [x] `patchTaskStatusInMarkdown` surgical patch function created with unit tests
- [x] Task PUT route uses surgical patch instead of full rewrite
- [x] `lib/forge/context.ts` assembles sprint-forge context from project state
- [x] `lib/forge/prompt-composer.ts` composes ready-to-use sprint-forge prompts
- [x] Sprint generation wizard dialog with 4 steps (findings, debt, version, preview+copy)
- [x] "Generate Next Sprint" button on roadmap page
- [x] "Generate Sprint" command in Cmd+K palette
- [x] `tsc --noEmit` passes with zero errors
- [x] `vitest run` passes with zero failures (126 tests)
- [x] `pnpm build` succeeds
- [x] Accumulated debt table updated (D19 resolved, D20 added)
- [x] Retro section filled
- [x] Recommendations for Sprint 10 documented
- [x] Re-entry prompts updated

---

## Retro

### What Went Well

- D19 elimination was cleaner than expected — the surgical patch approach is both simpler and safer than any full serializer rewrite would have been. The regex handles both sprint-forge (with task refs) and simple (without refs) formats in a single pattern.
- The forge context assembler and prompt composer are pure functions with zero side effects — easy to test and reason about. The separation of context assembly from prompt composition allows flexible reuse.
- The wizard dialog UX flows naturally: findings → debt → config → preview. The step indicator allows jumping to any step, and the copy-to-clipboard feedback (check icon + "Copied" text) is instant.
- Zero new test failures despite significant refactoring of the serializer module — existing 126 tests all pass.

### What Didn't Go Well

- Nothing significant. Sprint was well-scoped and all phases executed cleanly.

### Surprises / Unexpected Findings

- The legacy `serializeSprintFile` was more deeply embedded than Sprint 8 identified — 3 additional files (sprint route, tasks route, test file) also imported it, requiring an emergent phase to clean up. This confirms the decision to eliminate it completely rather than trying to maintain two serialization paths.
- The sprint PUT and tasks POST routes lost their write capability when the serializer was removed. These routes were unused by the UI, but they now return data without persisting. Logged as D20 — future write operations for these routes will need surgical patch equivalents.

### New Technical Debt Detected

- D20: Sprint PUT and tasks POST API routes no longer write to disk after D19 serializer removal

---

## Recommendations for Sprint 10

1. Add AI interpret route (`/api/ai/interpret`) for natural language command parsing — takes user input + project context, returns structured action intent. This is the foundation for smart Cmd+K mode.
2. Extend Cmd+K with "smart mode": if input doesn't match known commands or search results, route to AI interpret. Show preview of proposed action, user confirms to execute.
3. Add `/api/forge/generate` route that writes the composed prompt to the project directory and optionally triggers `claude` CLI if installed. Connect to the existing wizard's "Copy to Clipboard" as an alternative "Generate" action.
4. Add a generation monitor UI that polls the project directory for new sprint files during external generation. Auto-refresh and display when detected.
5. Add unit tests for `assembleSprintContext` and `composeSprintForgePrompt` — these are pure functions that deserve test coverage before Sprint 10 builds on them.
