---
title: "Sprint 3 — SSR Data Fetching & Routing Consolidation"
created: 2026-03-07
updated: 2026-03-07
project: kyro-evolution
sprint: 3
status: closed
progress: 100
version: 3.2.0
type: refactor
previous_doc: sprints/SPRINT-2-e2e-ai-tests.md
next_doc: sprints/SPRINT-4-sqlite-index-file-watcher.md
related_findings:
  - findings/03-url-routing-ssr.md
agents:
  - claude-opus-4-6
changelog:
  - version: "1.0"
    date: "2026-03-07"
    changes:
      - "Sprint generated — scope adapted: URL routing already complete, focus shifted to SSR data fetching + consolidation"
---

# Sprint 3 — SSR Data Fetching & Routing Consolidation

> Source: `findings/03-url-routing-ssr.md`
> Previous Sprint: `sprints/SPRINT-2-e2e-ai-tests.md`
> Version Target: 3.2.0
> Type: refactor
> Carry-over: 0 items from previous sprint
> Execution Date: 2026-03-07
> Executed By: claude-opus-4-6

---

## Sprint Objective

**Roadmap adaptation**: Finding 03 described a full URL routing migration, but exploration reveals that URL routing was already implemented during the predecessor project's lifecycle (17 page.tsx files, `<Link>` navigation, `router.push()` in command palette, `ContentRouter` deleted, navigation state removed from Zustand). The remaining work is: (1) migrate data fetching from client-side Zustand to Server Components where practical, (2) fix the root page redirect bug (D6), (3) update CLAUDE.md to reflect the current architecture, (4) add the deferred `updateFrontmatterField()` AST writer function, and (5) improve E2E test reliability. After this sprint, the codebase documentation matches reality, data loading is server-optimized, and the regression test suite runs against a production build.

---

## Disposition of Previous Sprint Recommendations

| # | Recommendation | Action | Where | Justification |
|---|---------------|--------|-------|---------------|
| 1 | Fix `app/page.tsx` to handle no-projects case — redirect to workspace onboarding route or show onboarding UI directly (D6) | Incorporated | Phase 2, T2.1 | Directly addresses D6; root redirect is a usability bug |
| 2 | Consider running E2E tests against production build (`next build && next start`) instead of dev server to eliminate cold-start compilation flakiness (D7) | Incorporated | Phase 5, T5.1 | Eliminates the most impactful E2E reliability issue |
| 3 | Add E2E test for finding drill-down detail page — current test only verifies the list, not clicking into a specific finding | Incorporated | Phase 5, T5.3 | Fills a gap in E2E coverage |
| S1-3 | Consider adding `updateFrontmatterField()` as a general-purpose AST writer function (deferred from Sprint 1) | Incorporated | Phase 4, T4.1–T4.3 | Sprint 3 introduces server-side data reads that benefit from generic frontmatter manipulation; no longer premature |

---

## Phases

### Phase 1 — CLAUDE.md & Documentation Update

**Objective**: Update project documentation to reflect the current architecture — URL routing is complete, ContentRouter is deleted, navigation state is removed from Zustand. Accurate docs prevent future agents from planning already-completed work.

**Tasks**:

- [x] **T1.1**: Update CLAUDE.md `Architecture` section — replace "No URL routing — all navigation is Zustand state" with the current App Router model; document the route structure (`app/(workspace)/[projectId]/[section]`), layout hierarchy, and URL-to-store sync pattern
  - Files: `CLAUDE.md`
  - Evidence: Rewrote Architecture section: documented App Router routes (14 routes), layout hierarchy (Root → Workspace → ProjectLayout → Page), data flow with AST writer, URL-based navigation patterns
  - Verification: CLAUDE.md accurately describes current routing architecture; no references to `ContentRouter` or Zustand-based navigation ✅

- [x] **T1.2**: Update CLAUDE.md `App Layout` section — replace `ContentRouter` diagram with current layout hierarchy (Root → Workspace → ProjectLayout → Page); update the "Adding a New Page" convention to reflect App Router file-based routing
  - Files: `CLAUDE.md`
  - Evidence: Replaced diagram with layout.tsx hierarchy; updated app/ tree to show (workspace)/[projectId]/ structure; updated "Adding a New Page" to reference App Router page creation; updated components/ tree (removed content-router.tsx, added Link/router.push notes, corrected ~18 UI components count)
  - Verification: App Layout section shows correct component hierarchy; "Adding a New Page" steps reference `app/(workspace)/[projectId]/` route creation ✅

- [x] **T1.3**: Update CLAUDE.md `State Management` section — remove references to removed navigation state (`activeSidebarItem`, `activeSprintId`, `activeSprintDetailId`, `activeFindingId`); document what IS persisted to sessionStorage now (`activeProjectId`, `sidebarCollapsed`)
  - Files: `CLAUDE.md`
  - Evidence: Rewrote Key State Slices table (removed Navigation slice, added Re-entry Prompts, Task Mutations, Columns slices); updated sessionStorage key to `kyro-ui-state`; updated persisted fields to `activeProjectId` + `sidebarCollapsed` only; replaced Navigation Interactions with Project Interactions
  - Verification: State Management section matches actual Zustand store slices; no references to deleted navigation state ✅

- [x] **T1.4**: Update ROADMAP.md Sprint 3 entry — change focus from "URL routing migration" to "SSR data fetching & consolidation"; mark URL routing as already completed in the Sprint Summary table
  - Files: `.agents/sprint-forge/kyro-evolution/ROADMAP.md`
  - Evidence: Updated Sprint Summary table (Sprint 2 → completed, Sprint 3 → active/refactor); updated Detailed Sprint 3 definition with adaptation note; updated dependency map label
  - Verification: Roadmap reflects the adapted Sprint 3 scope ✅

### Phase 2 — Root Page Fix (D6)

**Objective**: Fix `app/page.tsx` so that users visiting `/` with no projects configured don't see an infinite spinner. The root redirect should either show the workspace onboarding flow or redirect to a workspace route that renders `WorkspaceOnboarding`.

**Tasks**:

- [x] **T2.1**: Fix `app/page.tsx` — when no projects exist after initialization completes, redirect to a workspace route (e.g., `/init/overview` or a dedicated onboarding URL) instead of spinning indefinitely waiting for a project ID
  - Files: `app/page.tsx` (DELETED)
  - Evidence: Deleted `app/page.tsx` entirely. Route `/` now falls through to `app/(workspace)/page.tsx` which goes through `WorkspaceShell` in `app/(workspace)/layout.tsx`. `WorkspaceShell` already handles no-projects → shows `WorkspaceOnboarding`. When projects exist → `WorkspaceRoot` redirects to first project. No duplicate `<Providers>` wrapping.
  - Verification: Navigate to `/` with no projects → onboarding UI appears within 3 seconds ✅; navigate to `/` with projects → redirects to first project overview ✅

- [x] **T2.2**: Add E2E test for root redirect with no projects — verify onboarding flow is accessible from `/`
  - Files: `tests/e2e/onboarding.spec.ts`
  - Evidence: Updated test: changed `page.goto("/init/overview")` to `page.goto("/")` — now tests the actual root URL instead of a workaround. Comment updated to reference D6 fix.
  - Verification: Test passes: visit `/` with empty projects → workspace onboarding visible ✅

- [x] **T2.3**: Add E2E test for root redirect with projects — verify redirect to first project overview
  - Files: `tests/e2e/navigation.spec.ts`
  - Evidence: Existing test "redirects to first project overview on load" already covers this — visits `/` and waits for URL redirect to `/{projectId}/overview`. Test passes (flaky on first cold-start, passes on retry — D7 issue addressed in Phase 5).
  - Verification: Test passes: visit `/` with projects → URL contains first project ID + `/overview` ✅

### Phase 3 — Server Components Data Fetching

**Objective**: Move initial data fetching from client-side Zustand `useEffect` to Server Components where practical. The page.tsx wrappers in `app/(workspace)/[projectId]/` are currently empty Server Components that render client page components — they can fetch data server-side and pass it as props, reducing client-side waterfall requests.

**Tasks**:

- [x] **T3.1**: Audit current data flow — document which page components fetch their own data client-side vs rely on store initialization; identify which pages can benefit from server-side props (candidates: overview, sprints list, findings list, roadmap, debt, documents)
  - Files: `components/pages/*.tsx`, `app/(workspace)/[projectId]/*/page.tsx`
  - Evidence: All 8 page components are client components (`"use client"`) reading from Zustand store via `useAppStore()`. Classification: 5 store-only (overview, sprints, debt, documents, readme), 2 store+lazy (findings, roadmap), 2 params-needed (sprint board, sprint detail). Project data is preloaded during `initializeApp()` with sprints embedded. Findings and roadmap are lazy-loaded per project.
  - Verification: Audit complete ✅

- [x] **T3.2**: Create a shared server-side data loader — `lib/server/load-project.ts` with `loadProject(projectId)` that reads project data from the filesystem directly (bypassing API routes for server-only reads); reuse existing `lib/file-format/` parsers
  - Files: `lib/server/load-project.ts` (NEW)
  - Evidence: Created `loadProject(projectId)` and `loadAllProjects()` functions. Reuses `parseProjectReadme()`, `loadSprintsFromDir()`, `resolveProjectRoot()`, `listProjects()`. Returns typed `ServerProject` with sprints. Build succeeds.
  - Verification: Functions exported, typed, build clean ✅

- [-] **T3.3**: Migrate overview page to server-side data fetching
  - Files: N/A
  - Evidence: SKIPPED — Store-centric architecture creates a dual-source problem. `ProjectOverviewPage` needs `activeProjectId` from store for link construction (`/${activeProjectId}/sprints`). Passing server-fetched data as props while component still reads store for navigation creates inconsistency. For a local filesystem app, API calls are localhost → localhost (~ms latency). Deferred to Sprint 4 when SQLite index changes data flow.
  - Justification: Premature optimization — design constraint "No premature SQLite optimization — only when queries are measurably slow" applies equally here

- [-] **T3.4**: Migrate sprints list page to server-side data fetching
  - Files: N/A
  - Evidence: SKIPPED — Same rationale as T3.3. The `SprintsPage` component uses `useAppStore()` for both project data and `activeProjectId` (link construction). No measurable latency to optimize.
  - Justification: Deferred with T3.3 to Sprint 4

- [x] **T3.5**: Evaluate remaining pages — determine if findings, roadmap, debt, documents pages should migrate now or defer to Sprint 4; document decision with justification
  - Files: N/A (analysis task)
  - Evidence: **Decision: Defer ALL page SSR migration to Sprint 4.** Rationale: (1) All pages depend on `useAppStore()` for both data AND `activeProjectId` for navigation — splitting this creates a dual-source antipattern. (2) Local filesystem reads are ~ms via API routes — no measurable latency benefit from SSR. (3) Sprint 4 (SQLite index) will fundamentally change the data flow — SSR migration should align with that architectural shift. The server loader (`lib/server/load-project.ts`) is ready for use when the time comes.
  - Verification: Decision documented ✅

### Phase 4 — AST Writer: updateFrontmatterField()

**Objective**: Add a generic `updateFrontmatterField()` function to the AST writer module, enabling any YAML frontmatter field to be updated without a dedicated function per field. This completes the deferred Sprint 1 recommendation and prepares the codebase for Sprint 4's index operations.

**Tasks**:

- [x] **T4.1**: Implement `updateFrontmatterField(content, field, value)` in `lib/file-format/ast-writer.ts` — parses YAML frontmatter, updates the specified field, preserves all other fields and document body; handles string, number, boolean, and array values
  - Files: `lib/file-format/ast-writer.ts`
  - Evidence: Implemented `updateFrontmatterField()` with helpers: `serializeFrontmatterValue()` (string/number/boolean/array), `quoteIfNeeded()` (YAML special chars), `escapeRegex()`. AST locates frontmatter node, regex targets specific field within bounds, appends new fields before closing `---`. Array values serialized as indented list items.
  - Verification: Function exported and handles all value types correctly ✅

- [x] **T4.2**: Add unit tests for `updateFrontmatterField()` — test cases: update string field, update number field, update boolean field, update array field (append + replace), add new field, preserve existing fields, handle missing frontmatter gracefully
  - Files: `lib/file-format/__tests__/ast-writer.test.ts`
  - Evidence: 12 new test cases: update string, update number, update boolean, update array (replace), empty array, add new field, preserve other fields, preserve body content, no frontmatter, special char quoting, numeric string quoting, updateSprintStatus delegation
  - Verification: All 44 AST writer tests pass (was 32, +12 new) ✅

- [x] **T4.3**: Refactor `updateSprintStatus()` to use `updateFrontmatterField()` internally — eliminate the dedicated status-specific frontmatter logic; verify round-trip consistency
  - Files: `lib/file-format/ast-writer.ts`
  - Evidence: `updateSprintStatus()` is now a one-liner: `return updateFrontmatterField(content, "status", newStatus)`. Deleted ~25 lines of duplicate frontmatter parsing logic. All 4 existing updateSprintStatus tests pass unchanged.
  - Verification: `updateSprintStatus()` delegates to `updateFrontmatterField()`; all 205 unit tests pass ✅

### Phase 5 — E2E Test Improvements

**Objective**: Address Sprint 2 recommendations — run E2E tests against a production build for reliability (D7), add finding drill-down detail test, and verify all tests pass with the new configuration.

**Tasks**:

- [x] **T5.1**: Switch Playwright to use production build — update `playwright.config.ts` webServer to run `next build && next start` instead of `next dev`; verify all 30+ existing tests pass
  - Files: `playwright.config.ts`
  - Evidence: Changed webServer command from `next dev --webpack` to `next build && next start`. Reduced timeouts (30s test, 10s expect) since production server has no compilation overhead. Increased webServer timeout to 180s to account for build step.
  - Verification: All 30 existing tests pass on first run, 0 flaky ✅

- [x] **T5.2**: Test with parallel workers — if production build eliminates cold-start issues, increase `workers` to 2 or `50%` and verify stability
  - Files: `playwright.config.ts`
  - Evidence: Tested with 2 workers (10.4s, 0 flaky) and 4 workers (9.3s, 0 flaky). Set to `"50%"` for portability. Production build completely eliminates dev server cold-start compilation issue. Performance: 30 tests in ~8.5s vs previous ~30s with 1 worker.
  - Verification: Tests pass reliably with parallel workers ✅ — D7 resolved

- [x] **T5.3**: Add finding drill-down detail E2E test — navigate to Findings list, click a specific finding, verify detail content renders (title, severity, description, affected files)
  - Files: `tests/e2e/navigation.spec.ts`
  - Evidence: Added "navigates to finding detail and shows content" test. Clicks finding → verifies heading, severity badge ("medium"), detailed description text, back button navigation.
  - Verification: Test passes: click finding → detail page renders with expected content ✅

- [x] **T5.4**: Run full verification — `pnpm test` (all unit tests), `pnpm test:e2e` (all E2E tests), `pnpm build` (production build), `pnpm lint` (zero errors)
  - Files: N/A (verification task)
  - Evidence: 205 unit tests (20 files), 31 E2E tests (8 specs, 8.5s), build clean, lint 0 errors / 19 warnings
  - Verification: All tests green, build clean, lint clean ✅

---

## Emergent Phases

<!-- This section starts EMPTY. It is populated during sprint EXECUTION when new work is discovered. -->

---

## Findings Consolidation

| # | Finding | Origin Phase | Impact | Action Taken |
|---|---------|-------------|--------|-------------|
| 1 | URL routing already fully implemented — 17 page.tsx files, ContentRouter deleted, Zustand nav state removed | Pre-execution analysis | High — Sprint 3 scope entirely invalidated, required roadmap adaptation | Adapted sprint scope: shifted from URL routing migration to SSR consolidation (Rule 8) |
| 2 | All pages are client components with store-centric data flow — SSR migration creates dual-source antipattern | Phase 3 T3.1 | Medium — Server Components page migration is premature | Created server loader as infrastructure; deferred page migration to Sprint 4 |
| 3 | `app/page.tsx` existed outside workspace layout group, intercepting `/` before `(workspace)` layout | Phase 2 T2.1 | Medium — no-projects users saw infinite spinner | Deleted `app/page.tsx`; `/(workspace)/page.tsx` now handles `/` through `WorkspaceShell` |
| 4 | Production build eliminates ALL E2E flakiness — 0 flaky tests, 3x faster, parallel workers work | Phase 5 T5.1–T5.2 | High — E2E suite transformed from unreliable to fast and stable | Switched to `next build && next start`, workers at 50%, 8.5s total |

---

## Accumulated Technical Debt

| # | Item | Origin | Sprint Target | Status | Resolved In |
|---|------|--------|--------------|--------|-------------|
| D1 | AI integration tests missing — only type contracts tested | Predecessor D21 | Sprint 2 | resolved | Sprint 2 |
| D2 | Action chaining not implemented — AI suggests single actions only | Predecessor D22 | Sprint 5 | open | — |
| D3 | Sprint Forge integration page not built — wizard on roadmap page instead | Predecessor D23 | Post-Sprint 5 | open | — |
| D4 | CLI spawn sanitization — prompt passed as argument to spawn() | Predecessor C3 | Deferred | open | — |
| D5 | ESLint config broken — `pnpm lint` fails with "eslint: command not found" or config migration error | Sprint 1 Phase 4 | Sprint 2 | resolved | Sprint 2 |
| D6 | `app/page.tsx` root redirect shows infinite spinner when no projects — should redirect to workspace onboarding | Sprint 2 Emergent A | Sprint 3 | resolved | Sprint 3 |
| D7 | E2E tests require `workers: 1` due to Next.js dev server cold-start compilation — consider production build or `turbo dev` | Sprint 2 Emergent A | Sprint 3 | resolved | Sprint 3 |
| D8 | SSR page migration deferred — all pages remain client components; server loader created but not wired to pages | Sprint 3 Phase 3 | Sprint 4 | open | — |
| D9 | CLAUDE.md stale after each sprint — docs drift from reality between sprint executions | Sprint 3 Phase 1 | Ongoing | open | — |

**Status values**: `open` | `in-progress` | `resolved` | `deferred` | `carry-over`

**Rules**:
- Never delete a row — only change status
- New items are appended at the bottom
- Inherited items keep their original numbers
- When resolved, fill "Resolved In" with the sprint number

---

## Definition of Done

- [x] CLAUDE.md updated to reflect current URL routing architecture (no references to ContentRouter or Zustand navigation)
- [x] ROADMAP.md Sprint 3 entry updated to reflect adapted scope
- [x] `app/page.tsx` fixed — no-projects case shows onboarding (D6)
- [x] Server-side data loader created (`lib/server/load-project.ts`)
- [-] At least 2 pages migrated to server-side data fetching — SKIPPED: store-centric architecture makes SSR migration premature; server loader created as infrastructure for Sprint 4
- [x] `updateFrontmatterField()` implemented with unit tests
- [x] `updateSprintStatus()` refactored to use `updateFrontmatterField()`
- [x] Playwright switched to production build
- [x] Finding drill-down E2E test added
- [x] All unit tests pass (`pnpm test`) — 205 tests, 20 files
- [x] All E2E tests pass (`pnpm test:e2e`) — 31 tests, 8 files, 8.5s
- [x] Build succeeds (`pnpm build`)
- [x] Lint passes (`pnpm lint`) — 0 errors, 19 warnings
- [x] Accumulated debt table updated — D6 and D7 resolved, D8 and D9 added
- [x] Retro section filled
- [x] Recommendations for Sprint 4 documented
- [x] Re-entry prompts updated

---

## Retro

### What Went Well

- Roadmap adaptation worked perfectly — discovering URL routing was already done before spending hours on it saved massive time
- D6 fix was elegant — deleting `app/page.tsx` was simpler and more correct than any redirect-based fix
- Production build E2E was transformative: 3x faster (30s → 8.5s), 0 flaky, parallel workers work, reduced timeouts
- `updateFrontmatterField()` was clean — the hybrid AST+positional pattern made it straightforward, and `updateSprintStatus()` became a one-liner

### What Didn't Go Well

- SSR page migration was correctly planned but premature — the store-centric architecture makes it impractical without a larger refactor
- CLAUDE.md had drifted significantly from reality — the docs described an architecture that hasn't existed for multiple sprints

### Surprises / Unexpected Findings

- Route group `(workspace)` silently handles `/` when `app/page.tsx` is removed — Next.js route resolution falls through to the group's page.tsx
- The E2E webServer timeout needed to increase (120s → 180s) for the `next build` step, but the actual test execution was 3x faster
- YAML frontmatter field replacement needed careful regex for array fields — matching indented list items after the field name

### New Technical Debt Detected

- D8: SSR page migration deferred — server loader exists but not wired to any pages
- D9: CLAUDE.md stale after each sprint — documentation drift is a recurring issue

---

## Recommendations for Sprint 4

1. When implementing SQLite index, evaluate whether the query layer should replace the Zustand store data flow — this would naturally enable Server Components (D8) since pages could query SQLite directly on the server
2. Add `updateFrontmatterField()` to the Sprint 4 index builder — the generic function can update `indexed_at`, `checksum`, and other metadata fields during reindexing
3. Consider a CI step that validates CLAUDE.md against actual codebase structure (D9) — a simple script that checks referenced files exist and key patterns match
