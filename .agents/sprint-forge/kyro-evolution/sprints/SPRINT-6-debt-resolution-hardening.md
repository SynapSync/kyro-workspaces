---
title: "Sprint 6 — Debt Resolution & Hardening"
created: 2026-03-08
updated: 2026-03-08
project: kyro-evolution
sprint: 6
status: completed
progress: 100
version: 3.5.0
type: debt
previous_doc: sprints/SPRINT-5-action-chaining.md
next_doc: null
related_findings:
  - findings/06-inherited-debt.md
agents:
  - claude-opus-4-6
changelog:
  - version: "1.1"
    date: "2026-03-08"
    changes:
      - "Sprint completed — all 5 phases (14 tasks) done, D3, D4, D11 resolved, flaky E2E fixed"
  - version: "1.0"
    date: "2026-03-08"
    changes:
      - "Sprint generated — debt resolution for D3, D4, D11; chain enum cleanup; E2E verification"
---

# Sprint 6 — Debt Resolution & Hardening

> Source: `findings/06-inherited-debt.md`, Sprint 5 retro
> Previous Sprint: `sprints/SPRINT-5-action-chaining.md`
> Version Target: 3.5.0
> Type: debt
> Carry-over: 0 items from previous sprint
> Execution Date: 2026-03-08
> Executed By: claude-opus-4-6

---

## Sprint Objective

All 5 original roadmap sprints are complete. The codebase has grown from 147 to 256 unit tests, gained AST-based writes, SQLite indexing, file watching, and AI action chaining — but 5 debt items remain open (D3, D4, D8, D9, D11). This sprint resolves the three actionable debt items (D3, D4, D11), incorporates all 3 recommendations from Sprint 5 (chain activity enum, E2E verification, Sprint Forge page), and updates documentation. D8 (SSR migration) remains deferred — it requires splitting every page component and is better addressed as a dedicated refactor sprint when there's a measurable performance case.

---

## Disposition of Previous Sprint Recommendations

| # | Recommendation | Action | Where | Justification |
|---|---------------|--------|-------|---------------|
| 1 | Add a dedicated `AgentActionType` enum value for chain activities (e.g., `"chain_action"`) to improve semantic clarity in the activity log — currently reuses `"moved_task"` which is imprecise | Incorporated | Phase 1, T1.1–T1.3 | Small scope, improves log clarity. Fits naturally as first phase before larger work. |
| 2 | Run E2E tests to verify the kanban fix (D10) and chain UI behavior in a real browser — unit tests cover logic but not visual rendering or dnd-kit interaction | Incorporated | Phase 5, T5.1 | Verification task — straightforward, fits in the final hardening phase. |
| 3 | Consider building the Sprint Forge integration page (D3) — the roadmap wizard on the roadmap page works but a dedicated page with generation history, health metrics, and quick-action buttons would improve discoverability | Converted to Phase | Phase 2 | Significant scope (new page, route, nav item, health metrics) — warrants its own phase. Also resolves D3. |

---

## Phases

### Phase 1 — Activity Type Cleanup

**Objective**: Add a dedicated `chain_action` enum value to `AgentActionTypeSchema` so chain activities have semantic clarity instead of reusing `moved_task`.

**Tasks**:

- [x] **T1.1**: Add `chain_action` to `AgentActionTypeSchema`
  - Files: `lib/types.ts`
  - Evidence: Added `"chain_action"` to enum. Backward-compatible — existing values unchanged.

- [x] **T1.2**: Add `chain_action` entry to `actionConfig` in `agents-activity-page.tsx`
  - Files: `components/pages/agents-activity-page.tsx`
  - Evidence: Added entry with `Link2` icon, `text-primary` color, `bg-primary/10` bgColor, label `"Chain Action"`.

- [x] **T1.3**: Update chain logging in `command-palette.tsx` to use `chain_action`
  - Files: `components/command-palette.tsx`
  - Evidence: Changed `actionType: "moved_task"` → `"chain_action"` in `logChainActivity()`.

### Phase 2 — Sprint Forge Integration Page (D3)

**Objective**: Build a dedicated Sprint Forge page with generation history, health metrics, and quick actions.

**Tasks**:

- [x] **T2.1**: Create `components/pages/sprint-forge-page.tsx`
  - Files: `components/pages/sprint-forge-page.tsx`
  - Evidence: Page component with 3 sections: Quick Actions (View Latest Sprint, Active Board links), Infrastructure Health (fetches `/api/health`), Generation History (sprint list with progress bars).

- [x] **T2.2**: Create route `app/(workspace)/[projectId]/forge/page.tsx`
  - Files: `app/(workspace)/[projectId]/forge/page.tsx`
  - Evidence: Standard App Router page rendering `SprintForgePage`.

- [x] **T2.3**: Add nav item to `NAV_ITEMS` in `lib/config.ts`
  - Files: `lib/config.ts`
  - Evidence: Added `Hammer` icon import, nav item `{ id: "forge", label: "Sprint Forge", icon: Hammer, href: "/forge" }` after Agents.

- [x] **T2.4**: Add `GET /api/health` endpoint
  - Files: `app/api/health/route.ts`
  - Evidence: Returns `{ indexReady, watcherCount, lastIndexedAt, dbSizeBytes, projectCount }`. Queries SQLite for project count and latest timestamp. Also resolves deferred Sprint 4 Rec 3.

### Phase 3 — CLI Spawn Sanitization (D4)

**Objective**: Eliminate passing user-controlled prompt text as a CLI argument to `spawn()`.

**Tasks**:

- [x] **T3.1**: Refactor `POST /api/forge/generate` to use stdin pipe
  - Files: `app/api/forge/generate/route.ts`
  - Evidence: Replaced `spawn(cliPath, ["-p", body.prompt])` with stdin pipe: `spawn(cliPath, ["-p", "-"], { stdio: ["pipe", "ignore", "ignore"] })`, write prompt via `child.stdin`. Prompt text no longer in process args.

- [x] **T3.2**: Add input validation (`validatePrompt()`)
  - Files: `app/api/forge/generate/route.ts`
  - Evidence: Added `validatePrompt()` — rejects >50KB prompts and null bytes/control characters (except `\n`, `\t`). Returns 400 with descriptive error.

### Phase 4 — File Watcher Integration Tests (D11)

**Objective**: Add tests for the file watcher pipeline.

**Tasks**:

- [x] **T4.1**: Add unit tests for file watcher core logic
  - Files: `lib/index/__tests__/file-watcher.test.ts`
  - Evidence: 16 tests covering: watcher creation/count, duplicate prevention, multi-project watching, unwatchProject/unwatchAll, file filtering (.md only, sprint-forge dirs only, null filename), debounce batching, deduplication, listener notification/unsubscribe, per-project grouping.

- [x] **T4.2**: Add integration test for watcher → reindex → listener
  - Files: `lib/index/__tests__/file-watcher.test.ts`
  - Evidence: Integration test verifies: file change → debounce wait → `reindexFile()` called → listener receives `{ projectId, files }` payload. Uses mocked `fs.watch` + `vi.useFakeTimers`.

### Phase 5 — E2E Verification & Documentation

**Objective**: Run full test suites and update documentation.

**Tasks**:

- [x] **T5.1**: Run full E2E suite
  - Evidence: 29 passed, 1 flaky (finding drill-down `getByText("medium")` — strict mode violation). Fixed flaky test with `.first()`. All kanban tests pass.

- [x] **T5.2**: Run full unit test suite
  - Evidence: 272 tests, 23 files — all pass. 0 errors, 21 warnings (pre-existing). +16 from file watcher tests.

- [x] **T5.3**: Update CLAUDE.md
  - Files: `CLAUDE.md`
  - Evidence: Added `/api/health` to API routes table, `/(workspace)/[projectId]/forge` to URL routing, `forge/` to module structure.

---

## Emergent Phases

### Emergent Phase — Flaky E2E Fix

**Reason**: E2E finding drill-down test was flaky — `getByText("medium")` matched both the severity filter button and the severity badge.

**Tasks**:

- [x] **TE.1**: Fix strict mode violation in `navigation.spec.ts:101` — use `.first()` to disambiguate
  - Files: `tests/e2e/navigation.spec.ts`
  - Evidence: Changed `getByText("medium").toBeVisible()` → `getByText("medium").first().toBeVisible()`.

---

## Findings Consolidation

| # | Finding | Origin Phase | Impact | Action Taken |
|---|---------|-------------|--------|-------------|
| F1 | `spawn()` with `shell: false` doesn't expand shell constructs — stdin pipe is the clean solution for D4 | Phase 3 | Low — initial approach using `$(cat ...)` wouldn't work | Used stdin pipe instead of file path substitution |
| F2 | E2E finding drill-down test was flaky due to `getByText("medium")` matching 2 elements | Phase 5, T5.1 | Low — intermittent failure | Fixed with `.first()` selector; added as emergent phase |
| F3 | Health endpoint can query SQLite directly via `getDb()` — no new exports needed from sqlite.ts | Phase 2, T2.4 | Low — simpler than expected | `getDb().prepare()` works directly for project count and timestamp |

---

## Accumulated Technical Debt

| # | Item | Origin | Sprint Target | Status | Resolved In |
|---|------|--------|--------------|--------|-------------|
| D1 | AI integration tests missing — only type contracts tested | Predecessor D21 | Sprint 2 | resolved | Sprint 2 |
| D2 | Action chaining not implemented — AI suggests single actions only | Predecessor D22 | Sprint 5 | resolved | Sprint 5 |
| D3 | Sprint Forge integration page not built — wizard on roadmap page instead | Predecessor D23 | Sprint 6 | resolved | Sprint 6 |
| D4 | CLI spawn sanitization — prompt passed as argument to spawn() | Predecessor C3 | Sprint 6 | resolved | Sprint 6 |
| D5 | ESLint config broken — `pnpm lint` fails with "eslint: command not found" or config migration error | Sprint 1 Phase 4 | Sprint 2 | resolved | Sprint 2 |
| D6 | `app/page.tsx` root redirect shows infinite spinner when no projects — should redirect to workspace onboarding | Sprint 2 Emergent A | Sprint 3 | resolved | Sprint 3 |
| D7 | E2E tests require `workers: 1` due to Next.js dev server cold-start compilation — consider production build or `turbo dev` | Sprint 2 Emergent A | Sprint 3 | resolved | Sprint 3 |
| D8 | SSR page migration deferred — all pages remain client components; hybrid approach documented but full migration requires splitting pages | Sprint 3 Phase 3 | Deferred | deferred | — |
| D9 | CLAUDE.md stale after each sprint — docs drift from reality between sprint executions | Sprint 3 Phase 1 | Ongoing | open | — |
| D10 | Kanban E2E test expects all 6 columns visible but empty columns now collapse by default (d40f5fc) | Sprint 4 Phase 6 | Sprint 5 | resolved | Sprint 5 |
| D11 | File watcher → SSE integration tests missing — individual components tested but end-to-end pipeline untested | Sprint 4 Phase 5 | Sprint 6 | resolved | Sprint 6 |

**Status values**: `open` | `in-progress` | `resolved` | `deferred` | `carry-over`

**Rules**:
- Never delete a row — only change status
- New items are appended at the bottom
- Inherited items keep their original numbers
- When resolved, fill "Resolved In" with the sprint number

---

## Definition of Done

- [x] `chain_action` enum value added to `AgentActionTypeSchema` and wired through all consumers
- [x] Sprint Forge integration page created with generation history and health metrics
- [x] `/api/health` endpoint returns index status, watcher count, db size
- [x] Nav sidebar includes "Sprint Forge" link
- [x] CLI spawn sanitization uses stdin pipe instead of direct prompt argument
- [x] Input validation on forge generate endpoint (max 50KB, no null bytes)
- [x] File watcher unit tests cover filtering, debouncing, cleanup
- [x] File watcher integration test verifies change → reindex → listener pipeline
- [x] D3 resolved (Sprint Forge page)
- [x] D4 resolved (CLI sanitization)
- [x] D11 resolved (file watcher tests)
- [x] All unit tests pass (`pnpm test`) — 272 tests, 23 files
- [x] All E2E tests pass (`pnpm test:e2e`) — 29 passed + 1 flaky fixed
- [x] CLAUDE.md updated with Sprint 6 changes
- [x] Accumulated debt table updated
- [x] Retro section filled
- [x] Recommendations for next sprint documented
- [x] Re-entry prompts updated

---

## Retro

### What Went Well

- **Smooth debt resolution** — All three targeted debt items (D3, D4, D11) resolved cleanly. No blockers, no scope creep. The debt sprint format works well when items are well-defined.
- **File watcher tests were straightforward** — Mocking `fs.watch()` with `vi.mock` and using fake timers for debounce testing worked perfectly. 16 tests cover all critical paths.
- **Health endpoint is a clean addition** — Querying SQLite directly via `getDb()` required no new exports or abstractions. Simple and useful.

### What Didn't Go Well

- **Sprint Forge page is display-only** — The page shows sprint history and health but doesn't have a "Generate" button yet because the forge wizard is tightly coupled to the roadmap page. This is a known limitation, not a regression.

### Surprises / Unexpected Findings

- **Flaky E2E test** — The finding drill-down test had been intermittently failing due to `getByText("medium")` matching both a filter button and a severity badge. Quick fix with `.first()`.
- **`spawn()` stdin pipe approach** — Initial plan was to pass file path to CLI, but `shell: false` doesn't expand shell constructs. Stdin pipe is cleaner and avoids file path in process args entirely.

### New Technical Debt Detected

- No new debt items detected

---

## Recommendations for Sprint 7

1. Wire the "Generate Sprint" action into the Sprint Forge page — currently the page is display-only; adding a button that opens the forge wizard (or a simplified version) would make it a true one-stop hub
2. Consider wiring SQLite query layer into `FileProjectsService` for read operations — deferred since Sprint 4, still no evidence of slowness, but the health endpoint confirms the index works well
3. Address D8 (SSR page migration) if performance profiling reveals client-side data fetching as a bottleneck — measure first with React DevTools or Lighthouse before committing to the split
