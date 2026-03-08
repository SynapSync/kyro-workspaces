---
title: "Finding: E2E Tests Outdated + AI Integration Tests Missing"
created: 2026-03-07
severity: high
agents:
  - claude-opus-4-6
---

# Finding: E2E Tests Outdated + AI Integration Tests Missing

## Summary

Playwright E2E tests have been broken since Sprint 4 of the predecessor project (UI changed to read-only model). Only unit tests (147 passing) are reliable. Additionally, the AI interpret layer (`lib/ai/interpret.ts`) has no integration tests — only type contracts are verified. Both gaps must be addressed before major infrastructure changes.

## Severity / Impact

**high** — E2E tests are the only way to verify full UI flows. Without them, regressions from URL routing migration (Sprint 3) or UI changes will go undetected. AI integration tests are needed to validate classification quality.

## Details

### E2E Tests (C2)

Current state of `tests/e2e/`:
- `navigation.spec.ts` — broken, references old UI model
- `helpers.ts` — shared API mocking utilities, may still work
- No specs for: kanban drag-drop, command palette, sprint forge wizard

The UI has evolved significantly since these tests were written:
- Sidebar navigation model changed
- Sprint board -> sprint detail drill-down added
- Finding drill-down added
- Breadcrumb navigation added
- Command palette (Cmd+K) added
- Sprint forge wizard added

### AI Integration Tests (D21 — inherited debt)

`lib/ai/interpret.ts` calls Claude Haiku to classify natural language into 5 action types. Current tests only verify TypeScript contracts (type shapes), not actual classification quality.

Missing test scenarios:
- "update task X to done" -> `update_task_status`
- "go to roadmap" -> `navigate`
- Ambiguous input -> fallback to `search`
- Empty input -> graceful handling
- Spanish input -> correct classification

## Affected Files

- `tests/e2e/navigation.spec.ts` — needs full rewrite
- `tests/e2e/helpers.ts` — audit for reusability
- `tests/e2e/kanban.spec.ts` — new
- `tests/e2e/command-palette.spec.ts` — new
- `tests/e2e/sprint-forge-wizard.spec.ts` — new
- `lib/ai/__tests__/interpret.integration.test.ts` — new
- `playwright.config.ts` — verify configuration still valid

## Recommendations

1. Audit existing E2E specs — identify what passes vs what's broken
2. Rewrite `navigation.spec.ts` for current model (sidebar pages, sprint detail, finding drill-down, breadcrumbs)
3. Add `kanban.spec.ts` — drag-drop task, confirmation dialog, status persistence
4. Add `command-palette.spec.ts` — Cmd+K open, search, navigate to result
5. Add `sprint-forge-wizard.spec.ts` — full wizard flow through 4 steps
6. Create `interpret.integration.test.ts` with mocked Anthropic client + JSON fixtures
7. Configure CI to run `pnpm test:e2e` on PRs
