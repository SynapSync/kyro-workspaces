---
title: "Finding: Inherited Technical Debt"
created: 2026-03-07
severity: medium
agents:
  - claude-opus-4-6
---

# Finding: Inherited Technical Debt

## Summary

Three debt items (D21, D22, D23) and one gap (C3) are inherited from the predecessor project `kyro-sprint-forge-reader`. D22 and D23 are addressed directly by sprints in the roadmap. D21 is bundled with Sprint 2 (E2E tests). C3 is low priority and tracked for later resolution.

## Severity / Impact

**medium** — None of these items are blockers. D21 and D22 are quality improvements. D23 is a UI enhancement. C3 is only relevant if the app is exposed to external users.

## Details

### D21: AI Integration Tests (inherited)

- **What**: `lib/ai/interpret.ts` only has type contract tests
- **Status**: Will be resolved in Sprint 2 alongside E2E test fixes
- **Effort**: Small (1-2 hours)

### D22: Action Chaining (inherited)

- **What**: AI suggests single actions only, no multi-step chains
- **Status**: Dedicated Sprint 5 in roadmap
- **Effort**: Medium (4-6 hours)

### D23: Sprint Forge Integration Page (inherited)

- **What**: Dedicated page for Sprint Forge replacing agents tab
- **Status**: Lower priority — wizard on roadmap page works. Can be addressed in Sprint 5 or deferred
- **Plan**: Create `components/pages/sprint-forge-page.tsx` with generation history, health metrics, quick-action buttons
- **Effort**: Medium (3-4 hours)

### C3: CLI Spawn Sanitization (gap)

- **What**: `app/api/forge/generate/route.ts` passes `body.prompt` as argument to `spawn()`. Safe for local use.
- **Status**: Low priority — only relevant if exposed to external users
- **Plan**: Write prompt to temp file, pass file path to CLI, validate input size (max 50KB)
- **Effort**: Small (1-2 hours)

## Affected Files

- `lib/ai/interpret.ts` — D21, D22
- `lib/ai/__tests__/interpret.integration.test.ts` — D21
- `components/command-palette.tsx` — D22
- `components/pages/sprint-forge-page.tsx` — D23
- `app/api/forge/generate/route.ts` — C3

## Recommendations

1. D21 resolved in Sprint 2 (bundled with E2E tests)
2. D22 resolved in Sprint 5 (dedicated sprint)
3. D23 evaluated after Sprint 5 — may be folded in or deferred
4. C3 tracked but deprioritized — address when/if external access is planned
