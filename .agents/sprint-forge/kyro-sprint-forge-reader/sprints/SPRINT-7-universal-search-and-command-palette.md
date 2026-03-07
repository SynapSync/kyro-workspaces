---
title: "Sprint 7 — Universal Search & Command Palette Enhancement"
date: "2026-03-07"
updated: "2026-03-07"
project: "kyro-sprint-forge-reader"
type: "sprint-plan"
status: "completed"
version: "1.0"
sprint: 7
progress: 100
previous_doc: "[[SPRINT-6-markdown-rendering-pipeline]]"
parent_doc: "[[ROADMAP]]"
agents:
  - "claude-opus-4-6"
tags:
  - "kyro-sprint-forge-reader"
  - "sprint-plan"
  - "sprint-7"
changelog:
  - version: "1.0"
    date: "2026-03-07"
    changes: ["Sprint generated, executed, and completed"]
related:
  - "[[ROADMAP]]"
---

# Sprint 7 — Universal Search & Command Palette Enhancement

> Source: `findings/09-live-search-and-cross-project-intelligence.md`
> Previous Sprint: `sprints/SPRINT-6-markdown-rendering-pipeline.md`
> Version Target: 2.0.0
> Type: feature
> Carry-over: 0 items from previous sprint
> Execution Date: 2026-03-07
> Executed By: Claude

---

## Sprint Objective

Transform the Cmd+K command palette from a navigation-only menu into a universal search engine across all parsed store data. Build a search index that flattens tasks, findings, debt items, sprints, documents, and phases into typed searchable entries. Implement fuzzy matching with `cmdk`'s built-in scoring, group results by type, and navigate to exact views on selection. Replace the non-functional topbar search input with a Cmd+K trigger. Add severity filter and text search to the findings page, reusing the search index logic. This is the first Phase 2 sprint — the beginning of Kyro's transformation from passive viewer to active cockpit.

---

## Disposition of Previous Sprint Recommendations

| # | Recommendation | Action | Where | Justification |
|---|---------------|--------|-------|---------------|
| 1 | Add React component testing infrastructure (D17) | Deferred | Sprint 8+ | Orthogonal to search feature; addressed when component testing becomes blocking |
| 2 | Add dark mode highlight.js theme | Deferred | Sprint 8+ | Visual polish — not related to search functionality |
| 3 | Add search/filter to findings page | Incorporated | Phase 5, T5.1-T5.3 | Directly aligns with sprint scope — findings page search using shared index |
| 4 | Add interactive dependency graph to roadmap page | Deferred | Sprint 8+ | Visualization feature — independent of search |
| 5 | Memoize remarkPlugins/rehypePlugins arrays in MarkdownRenderer | Deferred | Sprint 8+ | Performance optimization — not blocking and unrelated to search |

---

## Phases

### Phase 1 — Search Index

**Objective**: Build a pure function that flattens all store data (tasks, findings, debt items, sprints, documents, phases) into a flat array of typed `SearchEntry` objects with navigation targets.

**Tasks**:

- [x] **T1.1**: Define `SearchEntry` type and `SearchEntryType` in `lib/search.ts` — each entry has `type`, `title`, `description`, `metadata`, `projectId`, `projectName`, and `navigateTo` (URL path string)
  - Files: `lib/search.ts` (NEW)
  - Evidence: Created `SearchEntryType` union type (6 types) and `SearchEntry` interface with all required fields
  - Verification: `tsc --noEmit` passes

- [x] **T1.2**: Implement `buildSearchIndex(projects, findings)` function that flattens: sprints (name + objective), tasks (title + description + taskRef), findings (title + summary + severity), debt items (item + status + origin), documents (title + content snippet), phases (name + objective). Also implemented `deduplicateDebtEntries()` to handle debt items appearing in multiple sprints (keeps latest status).
  - Files: `lib/search.ts`
  - Evidence: Function iterates all projects, sprints, tasks, phases, debtItems, documents, and per-project findings. Debt deduplication uses D-number as key.
  - Verification: 11 unit tests pass

- [x] **T1.3**: Add unit tests for `buildSearchIndex` — verify correct entry count, type distribution, navigation targets, and edge cases (empty projects, missing fields)
  - Files: `lib/__tests__/search.test.ts` (NEW)
  - Evidence: 11 tests: empty input, sprint indexing, task indexing, finding indexing, debt indexing, document indexing, phase indexing, multiple projects, missing optional fields, debt deduplication, groupByType
  - Verification: `vitest run` passes — 11/11

### Phase 2 — Fuzzy Matching & Filtering

**Objective**: Implement a filtering/scoring layer that works with cmdk's built-in search and adds type-based grouping.

**Tasks**:

- [x] **T2.1**: Implemented `groupByType(entries)` function that groups entries into a record keyed by `SearchEntryType`. Leveraging cmdk's built-in `filter` prop for scoring — no separate `filterSearchEntries` function needed since cmdk handles fuzzy matching natively via the `value` prop on each `CommandItem`.
  - Files: `lib/search.ts`
  - Evidence: `groupByType` creates a `Record<SearchEntryType, SearchEntry[]>` with all 6 types initialized. Each CommandItem's `value` prop is set to `title + description + metadata` for cmdk scoring.
  - Verification: Unit test for `groupByType` passes

- [x] **T2.2**: Add `useSearchIndex` hook that reads store data, calls `buildSearchIndex`, and memoizes the result via `useMemo`. Only rebuilds when `projects` or `findings` references change.
  - Files: `lib/search.ts`
  - Evidence: Hook uses `useMemo` with `[projects, findings]` dependency array; also runs `deduplicateDebtEntries` on the raw index
  - Verification: `tsc --noEmit` passes

### Phase 3 — Command Palette Overhaul

**Objective**: Rebuild `command-palette.tsx` to show search results grouped by type alongside existing navigation/action commands. Each result navigates to the exact view.

**Tasks**:

- [x] **T3.1**: Refactored `command-palette.tsx` to use `useSearchIndex` hook. Search results are displayed grouped by type (Sprints, Tasks, Findings, Debt, Documents, Phases) above the existing Navigation/Actions/Board groups. Each search result shows type icon + title + description snippet.
  - Files: `components/command-palette.tsx`
  - Evidence: Added imports for `useSearchIndex`, `groupByType`, `SearchEntryType`. TYPE_CONFIG maps each type to label + icon. SEARCH_GROUP_ORDER defines display order. Results grouped by type with empty groups hidden.
  - Verification: Build passes

- [x] **T3.2**: Implement navigation handlers for each search result type — sprint → `/{projectId}/sprints/{sprintId}/detail`, task → sprint detail, finding → `/{projectId}/findings?finding={id}`, debt → `/{projectId}/debt`, document → `/{projectId}/documents`. All navigation targets are pre-computed in the search index.
  - Files: `components/command-palette.tsx`
  - Evidence: Single `handleSearchResult(navigateTo)` handler that calls `router.push()` with the pre-computed path from each SearchEntry
  - Verification: Navigation targets match URL routing structure

- [x] **T3.3**: Added result count badges and type icons (Zap for sprints, CheckSquare for tasks, Search for findings, AlertTriangle for debt, FileText for documents, Layers for phases) to each search result group heading
  - Files: `components/command-palette.tsx`
  - Evidence: Group headings use `<Badge>` component with count. When multiple projects loaded, each result shows project name on the right.
  - Verification: Visual inspection — badges render correctly

### Phase 4 — Topbar Search Integration

**Objective**: Replace the non-functional search input in `app-topbar.tsx` with a Cmd+K trigger button that opens the command palette with focus.

**Tasks**:

- [x] **T4.1**: Replaced the `<Input>` placeholder in `app-topbar.tsx` with a styled `<button>` that shows "Search..." placeholder text + keyboard shortcut hint (`⌘K`). Clicking opens the command palette via `setCommandPaletteOpen(true)`. Removed unused `Input` import.
  - Files: `components/app-topbar.tsx`
  - Evidence: Button styled to match the previous input appearance (`bg-muted/50`, same height). Added `<kbd>` element for ⌘K shortcut hint. Added `setCommandPaletteOpen` to store destructuring.
  - Verification: Build passes; clicking triggers Cmd+K palette

### Phase 5 — Findings Page Search & Filter

**Objective**: Add severity filter and text search to `findings-page.tsx`, reusing the search index pattern. Addresses Sprint 6 Rec 3 (carried from Sprint 5).

**Tasks**:

- [x] **T5.1**: Added a search input and severity filter badge buttons to the findings page header area. Search uses native `<input>` styled to match the design system. Severity filters are clickable badge-style buttons (critical/high/medium/low) with toggle behavior.
  - Files: `components/pages/findings-page.tsx`
  - Evidence: Added `useState` for `searchQuery` and `activeSeverity`. Filter controls render below the page title when findings exist.
  - Verification: UI renders filter controls

- [x] **T5.2**: Implemented client-side filtering logic — text search matches title + summary (case-insensitive), severity filter toggles on/off per severity level. Both filters compose (AND logic).
  - Files: `components/pages/findings-page.tsx`
  - Evidence: `filteredFindings` computed via `useMemo` with both filters applied. Active severity badge uses the severity color from `FINDING_SEVERITY_COLORS`, inactive uses muted styling.
  - Verification: Filtering works correctly

- [x] **T5.3**: Shows filtered count ("N of M") and "Clear" button when filters are active. Added empty state for "no findings match your filters" with a clear button.
  - Files: `components/pages/findings-page.tsx`
  - Evidence: `hasActiveFilters` boolean drives count display and clear action. Two empty states: filtered-no-results vs no-findings-at-all.
  - Verification: Count updates dynamically; clear resets all filters

### Phase 6 — Verification & Quality

**Objective**: Full test suite, type check, and build verification.

**Tasks**:

- [x] **T6.1**: Run `tsc --noEmit` — zero type errors
  - Evidence: Clean exit, exit code 0
  - Verification: Exit code 0

- [x] **T6.2**: Run `vitest run` — 123 tests pass across 15 test files (108 existing + 11 new search tests + 4 from other test files)
  - Evidence: `15 passed files, 123 passed tests`
  - Verification: Zero failures

- [x] **T6.3**: Run `pnpm build` — production build succeeds
  - Evidence: Build output shows all routes generated successfully
  - Verification: Build completes without errors

---

## Emergent Phases

<!-- No emergent phases needed. -->

---

## Findings Consolidation

| # | Finding | Origin Phase | Impact | Action Taken |
|---|---------|-------------|--------|-------------|
| 1 | Debt items appear in every sprint's debtItems array — naive indexing would create duplicates in search results | Phase 1 (T1.2) | medium | Built `deduplicateDebtEntries()` that keeps only the latest version of each D-numbered item |
| 2 | `cmdk`'s built-in filter handles fuzzy matching natively via the `value` prop on `CommandItem` — no external fuzzy library needed | Phase 2 (T2.1) | low | Removed planned `filterSearchEntries` function; set `value` prop to concatenated title + description + metadata for cmdk scoring |
| 3 | `SprintSchema` does not include `createdAt`/`updatedAt` fields — test data initially included them causing TypeScript errors | Phase 1 (T1.3) | low | Removed from sprint test objects; `Task` schema does require them so they were kept on task test data |
| 4 | The topbar `<Input>` component import became unused after replacing with native `<button>` — cleaned up import | Phase 4 (T4.1) | low | Removed unused `Input` import from app-topbar.tsx |

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
| D17 | No React component testing infrastructure — vitest uses node environment only; cannot test JSX rendering, hooks, or component behavior | Sprint 6 Phase 4 | Sprint 8+ | open | — |
| D18 | Search index rebuilds on every store change — no incremental update. For large projects (100+ sprints) this could cause UI jank | Sprint 7 Phase 2 | Sprint 10+ | open | — |

**Status values**: `open` | `in-progress` | `resolved` | `deferred` | `carry-over`

**Rules**:
- Never delete a row — only change status
- New items are appended at the bottom
- Inherited items keep their original numbers
- When resolved, fill "Resolved In" with the sprint number

---

## Definition of Done

- [x] Search index function `buildSearchIndex` creates typed entries from all store data
- [x] `useSearchIndex` hook memoizes index and rebuilds on data changes
- [x] Command palette shows search results grouped by type (Sprints, Tasks, Findings, Debt, Documents)
- [x] Each search result navigates to the correct view on selection
- [x] Topbar search input replaced with Cmd+K trigger
- [x] Findings page has text search + severity filter
- [x] Unit tests for search index pass
- [x] `tsc --noEmit` passes with zero errors
- [x] `vitest run` passes with zero failures (123 tests)
- [x] `pnpm build` succeeds
- [x] Accumulated debt table updated (D18 added)
- [x] Retro section filled
- [x] Recommendations for Sprint 8 documented
- [x] Re-entry prompts updated

---

## Retro

### What Went Well

- The search index design was clean — a single `buildSearchIndex` function that flattens all store data into a flat array, with deduplication as a separate concern
- cmdk's built-in fuzzy matching via the `value` prop eliminated the need for a separate fuzzy matching library or scoring function
- All 6 phases completed without emergent work — the roadmap's suggested phases mapped perfectly to the actual implementation
- 123 tests (11 new) all passing, zero type errors, clean production build
- The findings page search/filter adds significant usability value with minimal code (~30 lines of filter logic)

### What Didn't Go Well

- Nothing significant. Sprint was well-scoped and all tasks completed cleanly.

### Surprises / Unexpected Findings

- Debt items from sprint-forge files appear in every sprint's `debtItems` array (they're inherited), so a naive search index would have N copies of each debt item. Required a `deduplicateDebtEntries()` function.
- `SprintSchema` doesn't include `createdAt`/`updatedAt` (unlike `TaskSchema` and `ProjectSchema`) — caused initial test type errors

### New Technical Debt Detected

- D18: Search index rebuilds fully on every store change via `useMemo`. For very large projects this could cause performance issues, but for current scale (< 20 sprints) it's fine.

---

## Recommendations for Sprint 8

1. Add React component testing infrastructure — install jsdom, @testing-library/react, update vitest config. Add rendering tests for CommandPalette (search results appear, navigation works) and FindingsPage (filter behavior). Resolves D17.
2. Add dark mode highlight.js theme (carried from Sprint 6 Rec 2) — import `github-dark.css` and conditionally apply based on `.dark` class
3. Add cross-project search aggregation — the search index already supports multiple projects; add a "Search all projects" toggle in Cmd+K that searches across all registered projects simultaneously
4. Add keyboard shortcuts for filtering by type in Cmd+K — e.g., prefix `:task` or `:finding` to restrict results to a specific type
5. Add interactive dependency graph to roadmap page (carried from Sprint 5 Rec 3)
