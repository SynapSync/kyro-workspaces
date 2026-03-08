---
title: "Sprint 10 — AI Instruction Layer + Autonomous Agent Loop"
date: "2026-03-07"
updated: "2026-03-07"
project: "kyro-sprint-forge-reader"
type: "sprint-plan"
status: "completed"
version: "1.0"
sprint: 10
progress: 100
previous_doc: "[[SPRINT-9-sprint-forge-trigger-and-prompt-composer]]"
parent_doc: "[[ROADMAP]]"
agents:
  - "claude-opus-4-6"
tags:
  - "kyro-sprint-forge-reader"
  - "sprint-plan"
  - "sprint-10"
changelog:
  - version: "1.0"
    date: "2026-03-07"
    changes: ["Sprint generated"]
related:
  - "[[ROADMAP]]"
---

# Sprint 10 — AI Instruction Layer + Autonomous Agent Loop

> Source: Convergence of `findings/09`, `findings/10`, `findings/11` + Growth-CEO Initiatives
> Previous Sprint: `sprints/SPRINT-9-sprint-forge-trigger-and-prompt-composer.md`
> Version Target: 3.0.0
> Type: feature
> Carry-over: 0 items from previous sprint
> Execution Date: 2026-03-07
> Executed By: Claude

---

## Sprint Objective

Add an AI-powered instruction layer that transforms Kyro's Cmd+K from a static command menu into a natural language interface. Build an `/api/ai/interpret` route that takes user input + project context and returns structured action intents. Extend the command palette with "smart mode" — unrecognized input routes to AI interpretation with action preview. Add `/api/forge/generate` that writes sprint-forge prompts to disk and optionally triggers the Claude CLI. Build a generation monitor that polls the project directory for new sprint files and auto-refreshes. Resolve D1 (hardcoded logo), D17 (React component testing), D18 (incremental search index), and D20 (broken write routes). This sprint closes Phase 2 and delivers Kyro v3.0.0.

---

## Disposition of Previous Sprint Recommendations

| # | Recommendation | Action | Where | Justification |
|---|---------------|--------|-------|---------------|
| 1 | Add AI interpret route (`/api/ai/interpret`) for natural language command parsing | Converted to Phase | Phase 1 | Core deliverable of Sprint 10 |
| 2 | Extend Cmd+K with "smart mode": if input doesn't match known commands or search results, route to AI interpret | Converted to Phase | Phase 2 | Core deliverable of Sprint 10 |
| 3 | Add `/api/forge/generate` route that writes the composed prompt to the project directory and optionally triggers `claude` CLI | Converted to Phase | Phase 3 | Core deliverable of Sprint 10 |
| 4 | Add a generation monitor UI that polls the project directory for new sprint files during external generation | Incorporated | Phase 3, T3.3-T3.4 | Part of the forge generate workflow |
| 5 | Add unit tests for `assembleSprintContext` and `composeSprintForgePrompt` | Incorporated | Phase 5, T5.2 | Pure functions that deserve coverage |

---

## Phases

### Phase 1 — AI Interpret Route

**Objective**: Create an API route that accepts natural language input + project context and returns a structured action intent. Install the Anthropic SDK. The route calls Claude to classify user intent into supported actions with parameters.

**Tasks**:

- [x] **T1.1**: Install `@anthropic-ai/sdk` package. Add `ANTHROPIC_API_KEY` to `.env.example` with documentation.
  - Files: `package.json`, `.env.example`
  - Evidence: `@anthropic-ai/sdk@0.78.0` installed. `.env.example` updated with `ANTHROPIC_API_KEY=` and documentation link.
  - Verification: `pnpm install` succeeds, package appears in dependencies

- [x] **T1.2**: Create `lib/ai/interpret.ts` — define `ActionIntent` type (`{ action: string, params: Record<string, string>, preview: string, confidence: number }`) and supported action types (`update_task_status`, `generate_sprint`, `refresh_project`, `navigate`, `search`). Create `interpretInstruction(input: string, context: ProjectContext)` function that calls Claude API with a system prompt describing available actions, current project state, and the user's instruction. Returns typed `ActionIntent`.
  - Files: `lib/ai/interpret.ts` (NEW)
  - Evidence: Uses `claude-haiku-4-5-20251001` for fast classification. System prompt defines 5 action types with param schemas. Falls back to `search` action on parse failure. `ProjectContext` interface provides sprint names, task summary, roadmap availability.
  - Verification: TypeScript compiles, function returns typed ActionIntent

- [x] **T1.3**: Create `app/api/ai/interpret/route.ts` — POST handler that accepts `{ instruction: string, context: ProjectContext }`, calls `interpretInstruction()`, returns `ActionIntent`. Handle missing API key gracefully (return 501 with message). Handle API errors (return 502).
  - Files: `app/api/ai/interpret/route.ts` (NEW)
  - Evidence: Validates `instruction` and `context` fields. Returns 400 for missing fields, 501 for missing API key, 502 for API errors. Context is passed directly from client (avoids server-side store access).
  - Verification: Route responds to POST, returns structured JSON

### Phase 2 — Smart Command Mode in Cmd+K

**Objective**: Extend the command palette so that when user input doesn't match any known command or search result, it offers to send the query to the AI interpret route. Show the AI-suggested action preview and let the user confirm before executing.

**Tasks**:

- [x] **T2.1**: Add "smart mode" state to `CommandPalette`: when `CommandEmpty` would show "No results found", instead show a "Ask AI" button that sends the current query to `/api/ai/interpret`. Add `aiPending`, `aiResult` state variables. Show a loading spinner while waiting. Display the AI response as a preview card with action description and "Execute" / "Cancel" buttons.
  - Files: `components/command-palette.tsx`
  - Verification: When typing an unrecognized command, AI suggestion appears

- [x] **T2.2**: Create `executeActionIntent(intent: ActionIntent)` function in the command palette that maps AI-returned actions to existing store/service calls: `update_task_status` → `updateTaskStatus()`, `generate_sprint` → open forge wizard, `refresh_project` → `refreshProject()`, `navigate` → `router.push()`, `search` → switch to search tab with pre-filled query. Log all AI-executed actions as activities.
  - Files: `components/command-palette.tsx`
  - Verification: AI-suggested actions execute correctly via existing pathways

### Phase 3 — Forge Generate Route + Monitor

**Objective**: Add an API route that writes a composed sprint-forge prompt to the project directory. Add a generation monitor that watches for new sprint files and auto-refreshes the project.

**Tasks**:

- [x] **T3.1**: Create `app/api/forge/generate/route.ts` — POST handler that accepts `{ projectId: string, prompt: string }`. Resolves the project's sprint-forge directory path, writes the prompt to `NEXT-SPRINT-PROMPT.md` in that directory. Returns `{ written: true, path: string }`. Uses `resolveAndGuard()` for path safety.
  - Files: `app/api/forge/generate/route.ts` (NEW)
  - Verification: Route writes prompt file to correct directory

- [x] **T3.2**: Add optional CLI trigger to the generate route: if `triggerCli` is true in the request body, attempt to detect the `claude` CLI (`which claude`), and if found, spawn it in the background with the prompt file as input in the project directory. Return `{ triggered: true, pid }` or `{ triggered: false, reason: "CLI not found" }`. Non-blocking — the route returns immediately.
  - Files: `app/api/forge/generate/route.ts`
  - Verification: CLI detection works, spawns process when available

- [x] **T3.3**: Create `app/api/forge/status/route.ts` — GET handler that accepts `projectId` as query param. Reads the project's `sprints/` directory, counts sprint files, and returns `{ sprintCount: number, latestSprint: string | null, lastModified: string | null }`. This enables polling.
  - Files: `app/api/forge/status/route.ts` (NEW)
  - Verification: Route returns current sprint count and latest file

- [x] **T3.4**: Add "Generate & Monitor" mode to `SprintForgeWizard`. After Step 3 (preview), add a "Generate" button alongside "Copy to Clipboard". "Generate" calls `/api/forge/generate`, then shows a polling UI: checks `/api/forge/status` every 5 seconds, compares sprint count. When a new sprint file is detected, shows success message and calls `refreshProject()` to update the UI. Add a "Cancel" button to stop polling.
  - Files: `components/dialogs/sprint-forge-wizard.tsx`
  - Verification: Wizard can write prompt, monitor for new sprints, and auto-refresh

### Phase 4 — Debt Resolution

**Objective**: Resolve open debt items D1, D17, D18, D20 targeted for this sprint.

**Tasks**:

- [x] **T4.1**: **D1** — Verified: "Clever" no longer exists in codebase. Sidebar already uses `workspaceName` from store (line 120 of `app-sidebar.tsx`), which defaults to `APP_NAME = "Kyro"` and is overridden by `.kyro/config.json` at init. D1 was already resolved in a prior session.
  - Files: `components/app-sidebar.tsx` (no changes needed)
  - Evidence: `grep -r "Clever" --include="*.ts" --include="*.tsx"` returns zero results. Store initializes `workspaceName: APP_NAME` and updates from workspace API response.
  - Verification: Sidebar shows workspace name instead of "Clever"

- [x] **T4.2**: **D17** — Add React component testing infrastructure. Install `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`. Create `vitest.config.ts` workspace config that runs `lib/**/*.test.ts` in node environment and `components/**/*.test.tsx` in jsdom environment. Add one smoke test: `components/__tests__/command-palette.test.tsx` that renders `CommandPalette` and verifies it mounts without errors.
  - Files: `vitest.config.ts`, `components/__tests__/command-palette.test.tsx` (NEW), `package.json`
  - Verification: `pnpm test` runs both node and jsdom tests

- [x] **T4.3**: **D18** — Add incremental search index updates. Modify `useSearchIndex` hook in `lib/search.ts` to use `useMemo` with fine-grained dependencies (project IDs + sprint counts + finding counts) instead of rebuilding on every store reference change. Add a version counter that only increments when actual data changes.
  - Files: `lib/search.ts`
  - Verification: Search index doesn't rebuild on unrelated store changes

- [x] **T4.4**: **D20** — Add surgical patch equivalents for Sprint PUT and Tasks POST routes. Sprint PUT: support updating sprint status field via `patchSprintStatusInMarkdown()`. Tasks POST: support adding a new task line to a phase section via `appendTaskToMarkdown()`. Both functions use regex to find the right location and insert/modify minimally.
  - Files: `lib/file-format/serializers.ts`, `app/api/projects/[projectId]/sprints/[sprintId]/route.ts`, `app/api/projects/[projectId]/sprints/[sprintId]/tasks/route.ts`
  - Verification: Routes write changes to disk, unit tests pass

### Phase 5 — Tests & Verification

**Objective**: Full test suite, type check, build verification, and unit tests for forge functions.

**Tasks**:

- [x] **T5.1**: Added 3 unit tests for AI interpret types in `lib/ai/__tests__/interpret.test.ts` — validates SupportedAction coverage, ProjectContext shape, ActionIntent shape. API call tests deferred to integration (requires real API key).
  - Files: `lib/ai/__tests__/interpret.test.ts` (NEW)
  - Evidence: 3 tests covering type contracts
  - Verification: Tests pass

- [x] **T5.2**: Added 9 unit tests for forge context/composer in `lib/forge/__tests__/forge.test.ts` — tests: empty project, last sprint extraction, open debt extraction, completed sprint counting, empty roadmap, all-completed roadmap, first non-completed sprint, prompt with all sections, prompt with empty selections.
  - Files: `lib/forge/__tests__/forge.test.ts` (NEW)
  - Evidence: 9 tests covering `assembleSprintContext`, `getNextSprintInfo`, `composeSprintForgePrompt`
  - Verification: Tests pass

- [x] **T5.3**: Added 6 unit tests for `patchSprintStatusInMarkdown` (2 tests) and `appendTaskToMarkdown` (4 tests) in `lib/file-format/__tests__/sprint.test.ts`. Tests cover YAML frontmatter patching, no-frontmatter fallback, task append after last task, append without ref, no-task-lines fallback, sub-item skipping.
  - Files: `lib/file-format/__tests__/sprint.test.ts`
  - Evidence: 6 new tests (total 16 in file)
  - Verification: Tests pass

- [x] **T5.4**: Run `tsc --noEmit` — zero type errors
  - Evidence: Clean exit, exit code 0
  - Verification: Exit code 0

- [x] **T5.5**: Run `vitest run` — 147 tests pass across 18 test files (16 unit + 2 component projects)
  - Evidence: `18 passed files, 147 passed tests`
  - Verification: Zero failures

- [x] **T5.6**: Run `pnpm build` — production build succeeds with all new routes: `/api/ai/interpret`, `/api/forge/generate`, `/api/forge/status`
  - Evidence: Build completes, all routes listed in output
  - Verification: Build completes without errors

---

## Emergent Phases

<!-- This section starts EMPTY. Populated during execution when new work is discovered. -->

---

## Findings Consolidation

| # | Finding | Origin Phase | Impact | Action Taken |
|---|---------|-------------|--------|-------------|
| F1 | D1 was already resolved in a prior session — no code changes needed | Phase 4, T4.1 | low | Verified via grep, marked resolved |
| F2 | `exec()` does not support `detached` option — must use `spawn()` for background CLI processes | Phase 3, T3.2 | medium | Switched from `exec()` to `spawn()` with `child.unref()` |
| F3 | Vitest workspace projects require separate environment configs (node vs jsdom) — cannot mix in single `test` block | Phase 4, T4.2 | medium | Used `test.projects` array with distinct `environment` per project |

---

## Accumulated Technical Debt

| # | Item | Origin | Sprint Target | Status | Resolved In |
|---|------|--------|--------------|--------|-------------|
| D1 | Logo "Clever" hardcoded in sidebar | Pre-existing | Sprint 10 | resolved | Sprint 10 |
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
| D17 | No React component testing infrastructure — vitest uses node environment only; cannot test JSX rendering, hooks, or component behavior | Sprint 6 Phase 4 | Sprint 10 | resolved | Sprint 10 |
| D18 | Search index rebuilds on every store change — no incremental update. For large projects (100+ sprints) this could cause UI jank | Sprint 7 Phase 2 | Sprint 10 | resolved | Sprint 10 |
| D19 | `serializeSprintFile` uses legacy Spanish-heading format that doesn't match sprint-forge output structure — writing back a parsed sprint-forge file would change its markdown structure | Sprint 8 Phase 1 | Sprint 9 | resolved | Sprint 9 |
| D20 | Sprint PUT and tasks POST API routes no longer write to disk — full file rewrite removed when D19 legacy serializer was deleted. These routes return data without persisting. Future write operations need surgical patch equivalents. | Sprint 9 Emergent | Sprint 10 | resolved | Sprint 10 |

**Status values**: `open` | `in-progress` | `resolved` | `deferred` | `carry-over`

**Rules**:
- Never delete a row — only change status
- New items are appended at the bottom
- Inherited items keep their original numbers
- When resolved, fill "Resolved In" with the sprint number

---

## Definition of Done

- [x] `@anthropic-ai/sdk` installed and `ANTHROPIC_API_KEY` documented in `.env.example`
- [x] `/api/ai/interpret` route accepts natural language + returns structured `ActionIntent`
- [x] Cmd+K "smart mode": unrecognized input → AI suggestion → user confirm → execute
- [x] `/api/forge/generate` route writes prompt to disk, optionally triggers CLI
- [x] `/api/forge/status` route enables polling for new sprint files
- [x] Sprint Forge Wizard has "Generate & Monitor" mode
- [x] D1 resolved — sidebar shows workspace name
- [x] D17 resolved — React component testing infrastructure with jsdom
- [x] D18 resolved — search index uses fine-grained memoization
- [x] D20 resolved — Sprint PUT and Tasks POST routes write to disk
- [x] Unit tests for AI interpret, forge context/composer, and new serializers
- [x] `tsc --noEmit` passes with zero errors
- [x] `vitest run` passes with zero failures
- [x] `pnpm build` succeeds
- [x] Accumulated debt table updated
- [x] Retro section filled
- [x] Recommendations documented
- [x] Re-entry prompts updated

---

## Retro

<!-- Filled when the sprint is CLOSED. -->

### What Went Well

- All 5 phases completed with zero carry-over — every task done and verified
- D1 turned out to be already resolved, saving time for the other 3 debt items
- Surgical markdown patching approach (from Sprint 9's D19 resolution) cleanly extended to `patchSprintStatusInMarkdown` and `appendTaskToMarkdown` — the pattern is proven
- Vitest workspace projects elegantly solved the node vs jsdom environment split (D17)
- Fingerprint-based memoization for search index (D18) is simple and effective — no complex diffing needed
- 147 tests across 18 files, zero type errors, clean production build — the codebase is solid at v3.0.0

### What Didn't Go Well

- Action chaining (Phase 5 in roadmap) was intentionally descoped — it requires more complex orchestration than a single sprint allows. The foundation is there but the full autonomous loop is deferred.
- AI interpret route requires a real API key for integration testing — unit tests only cover type contracts, not actual classification quality

### Surprises / Unexpected Findings

- `exec()` from `child_process` does not support the `detached` option — had to switch to `spawn()` for background CLI process (F2)
- D1 was already resolved in a prior session — grep confirmed zero references to "Clever" in the codebase
- The sprint-forge prompt composer + wizard from Sprint 9 integrated cleanly with the new generate route — no modifications needed to existing forge code

### New Technical Debt Detected

- D21: AI interpret integration tests missing — current tests only validate types, not actual Claude API classification quality. Requires API key + mock server or recorded responses.
- D22: Action chaining not implemented — roadmap Phase 5 "Action Chaining" was descoped. The AI can suggest individual actions but cannot chain multi-step workflows autonomously.
- D23: Sprint Forge Integration Page not built — roadmap suggested replacing agents page with a dedicated Sprint Forge command center page. Deferred in favor of the wizard approach embedded in roadmap page.

---

## Recommendations for Sprint 11

1. Build the Sprint Forge Integration Page (D23) — a dedicated page replacing the agents tab that shows generation history, project health metrics (open debt count, finding resolution rate, sprint velocity), and quick-action buttons. This consolidates sprint-forge operations in one place.
2. Add AI interpret integration tests (D21) — use recorded API responses or a mock Anthropic server to test classification quality without requiring a live API key. Cover edge cases: ambiguous input, multi-action input, non-English input.
3. Implement action chaining (D22) — allow the AI to suggest and execute multi-step workflows (e.g., "analyze findings and generate next sprint"). Each step in the chain should be logged individually and require user confirmation at each stage.
4. Add E2E tests for the Sprint Forge Wizard flow — test the full wizard: open from roadmap → select findings → select debt → configure version → preview prompt → copy to clipboard.
5. Consider adding WebSocket or SSE for real-time generation monitoring instead of polling — the current 5-second polling works but is not ideal for responsiveness.
