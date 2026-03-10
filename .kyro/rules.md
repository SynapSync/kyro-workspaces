# Kyro Learned Rules

> Accumulated from sprint executions. These rules apply across all projects.
> Last updated: 2026-03-09

---

## E2E Testing

[RULE-001] Every new UI element that displays text matching existing elements must use data-testid attributes
  Context: Sprints 5, 6, 7 all had emergent E2E phases from Playwright strict mode violations caused by duplicate visible text.
  Source: kyro-evolution retro (Sprints 1-7)

## Debt Management

[RULE-002] If a debt item is deferred 3+ sprints with no evidence of impact, close it as "accepted design choice"
  Context: D8 was deferred across 5 sprints with identical justification. Perpetual deferral wastes disposition table space.
  Source: kyro-evolution retro (Sprints 1-7)

## Product Constraints

[RULE-003] Never create sprint content from Kyro UI — sprints are AI-generated artifacts. Kyro reads and refines, never creates.
  Context: Strategic constraint from product owner. The Sovereign Editor initiative was rejected for this reason.
  Source: q1-2026-growth strategic analysis

## Markdown Mutations

[RULE-004] All markdown mutations must go through unified/remark AST — no regex writes, no string concatenation
  Context: Sprint 1 eliminated all regex writes. This rule prevents regression. Round-trip tests validate.
  Source: kyro-evolution Sprint 1

## UI / Charts

[RULE-005] Prefer pure SVG over chart libraries for simple visualizations
  Context: Sprint 7 built velocity + debt charts with inline SVG — no dependency added, full style control, smaller bundle.
  Source: kyro-evolution Sprint 7
