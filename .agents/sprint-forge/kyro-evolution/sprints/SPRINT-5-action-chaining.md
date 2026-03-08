---
title: "Sprint 5 — Action Chaining"
created: 2026-03-08
updated: 2026-03-08
project: kyro-evolution
sprint: 5
status: active
progress: 0
version: 3.4.0
type: feature
previous_doc: sprints/SPRINT-4-sqlite-index-file-watcher.md
next_doc: null
related_findings:
  - findings/05-action-chaining.md
  - findings/06-inherited-debt.md
agents:
  - claude-opus-4-6
changelog:
  - version: "1.0"
    date: "2026-03-08"
    changes:
      - "Sprint generated — multi-step AI action chains from Cmd+K, D22 resolution"
---

# Sprint 5 — Action Chaining

> Source: `findings/05-action-chaining.md`, `findings/06-inherited-debt.md`
> Previous Sprint: `sprints/SPRINT-4-sqlite-index-file-watcher.md`
> Version Target: 3.4.0
> Type: feature
> Carry-over: 0 items from previous sprint
> Execution Date: {execution_date}
> Executed By: {executor}

---

## Sprint Objective

Extend the AI interpret layer to detect and execute multi-step action chains from Cmd+K. Currently, `interpretInstruction()` classifies natural language into exactly one action, discarding compound intents like "mark T3.2 as done and refresh the project." This sprint adds `ActionChain` types, updates the system prompt to return ordered action arrays, builds a step-by-step preview and execution UI in the command palette, and adds per-step activity logging. A safety cap of 5 actions per chain and mandatory confirmation for destructive steps ensure controlled execution. This resolves D2 (inherited D22).

---

## Disposition of Previous Sprint Recommendations

| # | Recommendation | Action | Where | Justification |
|---|---------------|--------|-------|---------------|
| 1 | Fix the kanban E2E test (D10) — update the test to account for empty column collapse behavior, or add mock data with tasks in all 6 statuses so all columns are visible | Incorporated | Phase 5, T5.4 | Straightforward test fix — fits naturally in the testing phase alongside chain integration tests |
| 2 | Consider wiring the SQLite query layer into the existing `FileProjectsService` for read operations — measure first, optimize if slow | Deferred | Post-Sprint 5 | Sprint 5 scope is focused on the AI layer and command palette; SQLite query integration into the service layer is an optimization that should be measured first, not speculated on. No evidence of slowness yet. |
| 3 | Add a health check endpoint (`GET /api/health`) that reports index status, watcher count, last indexation time, and database size | Deferred | Post-Sprint 5 | Useful but additive — not blocking any Sprint 5 work. Can be added as a standalone task after this sprint. D9 (CLAUDE.md staleness) is higher priority for the same "observability" category. |

---

## Phases

### Phase 1 — Types & System Prompt

**Objective**: Define the `ActionChain` and `ChainExecutionState` types, and extend the AI system prompt to detect multi-step intents and return an ordered action array.

**Tasks**:

- [x] **T1.1**: Define `ActionChain` and `ChainExecutionState` types — `ActionChain = { id: string; steps: ActionIntent[]; }`, `ChainExecutionState = { chain: ActionChain; currentStep: number; results: Record<number, { success: boolean; error?: string }>; status: "preview" | "executing" | "paused" | "completed" | "cancelled" }`. Add to `lib/ai/interpret.ts` alongside existing types. Single actions become chains with 1 step (backward compatible).
  - Files: `lib/ai/interpret.ts`
  - Evidence: Added `ActionChain`, `ChainExecutionState`, `ChainStepResult`, `ChainStepStatus` types. `ActionChain = { id: string; steps: ActionIntent[] }`. `ChainExecutionState` tracks `currentStep`, per-step `results`, and overall `status`. Extracted `VALID_ACTIONS` array and `MAX_CHAIN_STEPS = 5` as module constants.
  - Verification: Types compile; existing `ActionIntent` unchanged; `ActionChain` wraps 1+ intents ✅

- [x] **T1.2**: Extend system prompt to detect compound intents — update `SYSTEM_PROMPT` to instruct the model to return `{ "chain": [...] }` when the input contains multiple actions (e.g., "and", "then", sequential instructions). Single actions return `{ "chain": [{ action, params, preview, confidence }] }`. Add examples of compound vs. single instructions to the prompt. Max 5 steps.
  - Files: `lib/ai/interpret.ts`
  - Evidence: System prompt updated with CHAIN DETECTION section. Includes detection rules for "and", "then", "after that", commas, sequential phrasing. 4 examples: single action, two-action, two-action with "then", three-action with commas. Max 5 steps enforced in prompt text. Response schema changed to `{ "chain": [...] }`.
  - Verification: Prompt includes multi-step detection rules and examples; max 5 enforced in prompt ✅

- [x] **T1.3**: Update `interpretInstruction()` return type — change return type from `Promise<ActionIntent>` to `Promise<ActionChain>`. Parse the `chain` array from the response. If the response is a single object (legacy format), wrap it in `{ id, steps: [intent] }`. Validate each step has a supported action. Generate chain `id` with `crypto.randomUUID()`.
  - Files: `lib/ai/interpret.ts`
  - Evidence: Return type changed to `Promise<ActionChain>`. Response parsed through `validateChain()` which handles both chain array and legacy single-action formats. `generateChainId()` uses `crypto.randomUUID()` with fallback for environments without it. `max_tokens` increased from 256 to 512 to accommodate multi-step responses.
  - Verification: Function returns `ActionChain`; single actions wrapped correctly; invalid actions filtered ✅

- [x] **T1.4**: Update API route to return `ActionChain` — modify `POST /api/ai/interpret` to return `{ data: ActionChain }` instead of `{ data: ActionIntent }`. The route itself needs no logic changes beyond the type.
  - Files: `app/api/ai/interpret/route.ts`
  - Evidence: Route variable renamed from `intent` to `chain`. Returns `{ data: chain }` where chain is `ActionChain`. Command palette updated to import `ActionChain` type and store `aiChain` state instead of `aiResult`, with backward-compatible `aiResult` derived as `aiChain?.steps[0]`.
  - Verification: Route returns chain structure; command palette receives and handles new format ✅

### Phase 2 — Chain Detection & Parsing

**Objective**: Implement robust chain detection logic that correctly parses compound instructions into ordered action steps, handles edge cases, and enforces the 5-action safety limit.

**Tasks**:

- [x] **T2.1**: Add chain validation and sanitization — implement `validateChain(raw: unknown): ActionChain` that: (1) validates each step has a supported action, (2) enforces max 5 steps (truncate with warning in last step's preview), (3) deduplicates consecutive identical actions, (4) assigns sequential step indices. Fallback: if parsing fails entirely, return a single-step `search` chain.
  - Files: `lib/ai/interpret.ts`
  - Evidence: `validateChain(raw, fallbackInput)` exported. Handles: chain array format, legacy single-action format, null/invalid input. Filters invalid actions, enforces MAX_CHAIN_STEPS=5, deduplicates consecutive identical actions (same action + same params). Returns fallback search chain for empty/invalid input. `generateChainId()` with crypto.randomUUID + fallback.
  - Verification: Handles malformed JSON, >5 steps, duplicate actions, missing fields ✅

- [x] **T2.2**: Add unit tests for chain detection — test cases: single action (backward compat), two-step chain ("mark done and refresh"), three-step chain ("navigate to sprints, search for blocked, update task"), max 5 enforcement (6-step input → 5 steps + warning), deduplication, malformed response fallback, empty input
  - Files: `lib/ai/__tests__/interpret.test.ts`, `lib/ai/__tests__/interpret.integration.test.ts`
  - Evidence: 30 tests total (5 type + 25 integration). New tests: `validateChain` (8 tests — legacy wrap, max 5 enforcement, deduplication, non-consecutive duplicates kept, invalid action filtering, null fallback, empty chain fallback, missing preview/confidence). Chain integration tests: two-step chain, three-step chain, legacy format backward compat. All existing classification and edge case tests updated for chain return type.
  - Verification: All 30 tests pass; no regressions ✅

### Phase 3 — Chain UI

**Objective**: Build the chain preview and step-by-step execution UI in the command palette. Users see all planned steps before execution, with progress tracking and the ability to cancel mid-chain.

**Tasks**:

- [x] **T3.1**: Replace single-action preview with chain preview card — when AI returns a chain, show a numbered list of steps (step number, action icon, preview text). Each step shows its status: pending (circle), executing (spinner), done (check), failed (x), cancelled (dash). Single-step chains look identical to the current single-action preview (no visual regression).
  - Files: `components/command-palette.tsx`
  - Evidence: `StepStatusIcon` component renders 6 status states (pending=Circle, executing=Loader2 spin, done=CheckCircle2 green, failed=XCircle red, cancelled=MinusCircle, confirm=AlertTriangle yellow). `ACTION_ICONS` maps each `SupportedAction` to a Lucide icon. Steps rendered as numbered list with action icon, preview text, step number, and conditional background tint for active/confirm/failed states.
  - Verification: Chain with 1 step shows single preview line + "Execute" button; multi-step chains show numbered list with status icons ✅

- [x] **T3.2**: Add chain execution controls — "Execute All" button starts sequential execution. "Cancel" button stops at current step (completed steps remain, pending steps become cancelled). Add a "Step" button for manual step-by-step mode (executes one step, waits for user to click "Next" or "Cancel"). Show overall progress (e.g., "Step 2 of 4").
  - Files: `components/command-palette.tsx`
  - Evidence: 4 control states: (1) Preview — Execute/Execute All + Step + Cancel buttons; single-step chains show only Execute. (2) Paused — Confirm/Next + Skip + Cancel. (3) Failed — Retry + Skip + Cancel. (4) Completed/Cancelled — Dismiss. Header shows "Step X of Y" during execution and "Chain Complete"/"Chain Cancelled" at end.
  - Verification: Execute All runs all steps; Cancel stops mid-chain; Step mode waits between steps ✅

- [x] **T3.3**: Add chain execution state management — create `useChainExecution` hook or manage state within the command palette: `chainState: ChainExecutionState | null`, `executeChain(chain)`, `executeNextStep()`, `cancelChain()`. Use `useCallback` and `useRef` for stable references. Reset state when palette closes.
  - Files: `components/command-palette.tsx`
  - Evidence: State managed inline (complexity didn't warrant separate hook). `chainState: ChainExecutionState | null`, `chainMode: "auto" | "step"`, `chainCancelledRef` for async cancellation. Functions: `handleExecuteChain(mode)`, `handleContinueChain()`, `handleRetryStep()`, `handleSkipStep()`, `handleCancelChain()`, `getStepStatus(index)`. All use `useCallback` for stable refs. State reset in palette open `useEffect`.
  - Verification: State transitions: preview → executing → completed/cancelled; cleanup on close ✅

- [x] **T3.4**: Wire chain step execution to existing action handlers — each step's `action` type maps to existing handlers: `update_task_status` → `updateTaskStatus()`, `generate_sprint` → open forge wizard, `refresh_project` → `refreshProject()`, `navigate` → `router.push()`, `search` → set search query. Some actions (forge wizard) are "terminal" — they close the palette, so the chain should mark remaining steps as cancelled.
  - Files: `components/command-palette.tsx`
  - Evidence: `executeStep(intent)` returns `{ success, terminal?, error? }`. Terminal actions (`update_task_status` → task picker, `generate_sprint` → forge wizard) set `terminal: true`, which stops chain execution. `refresh_project` calls `refreshProject()`, `navigate` uses `router.push()`, `search` sets search query + tab. `DESTRUCTIVE_ACTIONS` array defines actions that pause for confirmation in auto mode.
  - Verification: Each action type executes correctly in chain context; terminal actions handled gracefully ✅

### Phase 4 — Activity Logging & Chain Tracking

**Objective**: Log each chain step as an independent activity with a reference to the parent chain, preserving the audit trail granularity. Make chains visible in the activity log.

**Tasks**:

- [x] **T4.1**: Extend `AgentActivity` type to support chain references — add optional `chainId?: string` and `chainStep?: number` fields to the activity schema. These fields link individual activities to their parent chain without breaking the existing flat activity log structure.
  - Files: `lib/types.ts`
  - Evidence: Added `chainId: z.string().optional()` and `chainStep: z.number().optional()` to `AgentActivitySchema`. Both fields are optional, so existing activities without chain fields remain valid. The inferred `AgentActivity` type automatically includes the new fields.
  - Verification: Schema accepts new fields; existing activities without chain fields still valid ✅

- [x] **T4.2**: Log chain execution activities — when a chain executes, log each step as a separate `AgentActivity` with `chainId` and `chainStep`. Log a chain-start activity (action: "chain_started", with step count) and chain-end activity (action: "chain_completed" or "chain_cancelled", with results summary). Use `addActivity()` from the store.
  - Files: `components/command-palette.tsx`
  - Evidence: Added `logChainActivity(chainId, step, description)` helper. Chain start logged with `chainStep: -1`, cancellation with `-2`, completion with `-3`. Each executed step logged with its index. Description includes step preview on success, error message on failure. Uses `addActivity()` from store with `metadata: { source: "ai-chain" }`.
  - Verification: Activity log shows individual step entries linked by chainId; start/end entries bracket the chain ✅

- [x] **T4.3**: Update agents activity page to display chain groups — in `AgentsActivityPage`, detect consecutive activities sharing a `chainId` and render them as a collapsible group with an expand/collapse toggle. Chain header shows: chain action summary, step count, overall status (completed/cancelled). Individual steps are indented under the group.
  - Files: `components/pages/agents-activity-page.tsx`
  - Evidence: Added `groupActivities()` function that groups activities by `chainId` into `ActivityGroup` unions (`single` | `chain`). Chain groups render as collapsible cards with Link2 icon, step count, success count. Expanded view shows numbered steps sorted by `chainStep`, with failed steps highlighted in destructive color. `expandedChains` state (Set) tracks toggle state. Extracted `ActivityCard` component for single activities.
  - Verification: Chain activities render as grouped entries with expand/collapse; non-chain activities unchanged ✅

### Phase 5 — Safety, Debt Fixes & Testing

**Objective**: Enforce safety constraints (max 5 actions, destructive step confirmation), fix D10 (kanban E2E test), and add comprehensive tests for the chain feature.

**Tasks**:

- [ ] **T5.1**: Add destructive action confirmation — before executing a step with `action === "update_task_status"` or `action === "generate_sprint"`, show a confirmation prompt within the chain preview (inline, not a separate dialog). Non-destructive actions (navigate, search, refresh) execute without confirmation. In "Execute All" mode, pause at destructive steps and resume after confirmation.
  - Files: `components/command-palette.tsx`
  - Evidence:
  - Verification: Destructive steps pause for confirmation; non-destructive steps auto-execute

- [ ] **T5.2**: Add chain cancellation and error recovery — if a step fails (API error, network timeout), mark it as failed, pause the chain, and show an error message with options: "Retry Step", "Skip Step", "Cancel Chain". Completed steps are never rolled back (actions are not idempotent in general).
  - Files: `components/command-palette.tsx`
  - Evidence:
  - Verification: Failed step shows error UI; retry re-executes the step; skip advances to next; cancel stops

- [ ] **T5.3**: Add integration tests for chain detection and execution — extend `lib/ai/__tests__/interpret.integration.test.ts` with chain scenarios: (1) mock Anthropic response with multi-step chain, (2) validate chain parsing, (3) test max-5 enforcement, (4) test backward compatibility with single-action response format
  - Files: `lib/ai/__tests__/interpret.integration.test.ts`
  - Evidence:
  - Verification: All integration tests pass; chain scenarios covered

- [ ] **T5.4**: Fix kanban E2E test (D10) — update `tests/e2e/kanban.spec.ts` (or equivalent) to seed mock data with tasks in all 6 statuses so all columns are visible, or update assertions to account for empty column collapse behavior from `d40f5fc`
  - Files: `tests/e2e/*.spec.ts`
  - Evidence:
  - Verification: Kanban E2E test passes consistently; no false failure from empty column collapse

- [ ] **T5.5**: Run full verification — `pnpm test` (all unit tests), `pnpm test:e2e` (all E2E tests including fixed kanban test), `pnpm lint` (zero errors)
  - Files: N/A (verification task)
  - Evidence:
  - Verification: Unit ✅, E2E ✅, lint ✅

### Phase 6 — Documentation & Cleanup

**Objective**: Update CLAUDE.md with the action chaining architecture and close D2.

**Tasks**:

- [ ] **T6.1**: Update CLAUDE.md — document `ActionChain` types in Architecture section, update the AI interpret layer description to reflect chain support, add chain execution flow to Data Flow diagram, note the 5-action safety limit and destructive step confirmation
  - Files: `CLAUDE.md`
  - Evidence:
  - Verification: CLAUDE.md reflects chain architecture; D9 partially addressed

- [ ] **T6.2**: Mark D2 as resolved — update the Accumulated Debt table: D2 status → `resolved`, Resolved In → `Sprint 5`
  - Files: This sprint document
  - Evidence:
  - Verification: Debt table reflects D2 resolution

---

## Emergent Phases

<!-- This section starts EMPTY. It is populated during sprint EXECUTION when new work is discovered. -->

---

## Findings Consolidation

<!-- This section is filled during sprint CLOSE, before the Retro. -->

| # | Finding | Origin Phase | Impact | Action Taken |
|---|---------|-------------|--------|-------------|

---

## Accumulated Technical Debt

| # | Item | Origin | Sprint Target | Status | Resolved In |
|---|------|--------|--------------|--------|-------------|
| D1 | AI integration tests missing — only type contracts tested | Predecessor D21 | Sprint 2 | resolved | Sprint 2 |
| D2 | Action chaining not implemented — AI suggests single actions only | Predecessor D22 | Sprint 5 | in-progress | — |
| D3 | Sprint Forge integration page not built — wizard on roadmap page instead | Predecessor D23 | Post-Sprint 5 | open | — |
| D4 | CLI spawn sanitization — prompt passed as argument to spawn() | Predecessor C3 | Deferred | open | — |
| D5 | ESLint config broken — `pnpm lint` fails with "eslint: command not found" or config migration error | Sprint 1 Phase 4 | Sprint 2 | resolved | Sprint 2 |
| D6 | `app/page.tsx` root redirect shows infinite spinner when no projects — should redirect to workspace onboarding | Sprint 2 Emergent A | Sprint 3 | resolved | Sprint 3 |
| D7 | E2E tests require `workers: 1` due to Next.js dev server cold-start compilation — consider production build or `turbo dev` | Sprint 2 Emergent A | Sprint 3 | resolved | Sprint 3 |
| D8 | SSR page migration deferred — all pages remain client components; hybrid approach documented but full migration requires splitting pages | Sprint 3 Phase 3 | Sprint 5+ | deferred | — |
| D9 | CLAUDE.md stale after each sprint — docs drift from reality between sprint executions | Sprint 3 Phase 1 | Ongoing | open | — |
| D10 | Kanban E2E test expects all 6 columns visible but empty columns now collapse by default (d40f5fc) | Sprint 4 Phase 6 | Sprint 5 | in-progress | — |
| D11 | File watcher → SSE integration tests missing — individual components tested but end-to-end pipeline untested | Sprint 4 Phase 5 | Sprint 5 | open | — |

**Status values**: `open` | `in-progress` | `resolved` | `deferred` | `carry-over`

**Rules**:
- Never delete a row — only change status
- New items are appended at the bottom
- Inherited items keep their original numbers
- When resolved, fill "Resolved In" with the sprint number

---

## Definition of Done

- [ ] `ActionChain` and `ChainExecutionState` types defined and compiling
- [ ] System prompt detects compound intents and returns ordered action arrays
- [ ] `interpretInstruction()` returns `ActionChain` (backward compatible with single actions)
- [ ] API route returns `ActionChain` structure
- [ ] Chain validation enforces max 5 steps, deduplication, fallback on parse failure
- [ ] Command palette shows chain preview with numbered steps and status icons
- [ ] "Execute All" and "Step" execution modes working
- [ ] Chain cancellation stops at current step, marks remaining as cancelled
- [ ] Destructive steps pause for confirmation during chain execution
- [ ] Failed steps show retry/skip/cancel options
- [ ] Chain activities logged with `chainId` and `chainStep` references
- [ ] Agents activity page groups chain activities with expand/collapse
- [ ] D2 resolved (action chaining implemented)
- [ ] D10 resolved (kanban E2E test fixed)
- [ ] All unit tests pass (`pnpm test`)
- [ ] All E2E tests pass (`pnpm test:e2e`)
- [ ] Lint passes (`pnpm lint`)
- [ ] CLAUDE.md updated with chain architecture
- [ ] Accumulated debt table updated
- [ ] Retro section filled
- [ ] Recommendations for next sprint documented
- [ ] Re-entry prompts updated

---

## Retro

<!-- Filled when the sprint is CLOSED. Do not fill during generation. -->

### What Went Well

-

### What Didn't Go Well

-

### Surprises / Unexpected Findings

-

### New Technical Debt Detected

-

---

## Recommendations for Sprint 6

<!-- Filled when the sprint is CLOSED. Each recommendation becomes a candidate task for the next sprint. -->

1.
2.
3.
