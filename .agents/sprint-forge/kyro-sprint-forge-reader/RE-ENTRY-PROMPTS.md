---
title: "kyro-sprint-forge-reader — Re-entry Prompts"
date: "2026-03-05"
updated: "2026-03-07"
project: "kyro-sprint-forge-reader"
type: "execution-plan"
status: "active"
version: "5.0"
agents:
  - "claude-opus-4-6"
tags:
  - "kyro-sprint-forge-reader"
  - "execution-plan"
  - "reentry"
  - "sprint-forge"
changelog:
  - version: "5.0"
    date: "2026-03-07"
    changes: ["Updated after Sprint 10 completion — AI instruction layer + D1/D17/D18/D20 resolved"]
  - version: "4.0"
    date: "2026-03-07"
    changes: ["Updated after Sprint 9 completion — sprint forge trigger + D19 resolved"]
  - version: "3.0"
    date: "2026-03-07"
    changes: ["Updated after Sprint 8 completion — kanban persistence + write actions"]
  - version: "2.0"
    date: "2026-03-07"
    changes: ["Phase 2 re-entry prompts — growth-ceo initiatives (sprints 7-10)"]
  - version: "1.0"
    date: "2026-03-05"
    changes: ["Re-entry prompts created"]
related:
  - "[[README]]"
  - "[[ROADMAP]]"
---

# kyro-sprint-forge-reader — Re-entry Prompts

> Last updated: 2026-03-07
> Current sprint: All 10 sprints completed
> Phase: 2 — From Viewer to Cockpit (COMPLETE)

These prompts help you (or a new agent) recover full project context in a new session.

---

## Output Directory

```
/Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-sprint-forge-reader
```

---

## Quick Reference

| Sprint | File | Status |
|--------|------|--------|
| 1 | `sprints/SPRINT-1-domain-types-and-parsers.md` | completed |
| 2 | `sprints/SPRINT-2-project-registry-and-api-refactor.md` | completed |
| 3 | `sprints/SPRINT-3-service-layer-and-store-adaptation.md` | completed |
| 4 | `sprints/SPRINT-4-ui-adaptation.md` | completed |
| 5 | `sprints/SPRINT-5-new-views-e2e-and-polish.md` | completed |
| 6 | `sprints/SPRINT-6-markdown-rendering-pipeline.md` | completed |
| 7 | `sprints/SPRINT-7-universal-search-and-command-palette.md` | completed |
| 8 | `sprints/SPRINT-8-kanban-persistence-and-write-actions.md` | completed |
| 9 | `sprints/SPRINT-9-sprint-forge-trigger-and-prompt-composer.md` | completed |
| 10 | `sprints/SPRINT-10-ai-instruction-layer.md` | completed |

---

## Dynamic Paths

| Resource | Path |
|----------|------|
| Codebase | `/Users/rperaza/joicodev/ideas/kyro` |
| Working Directory | `/Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-sprint-forge-reader` |
| Roadmap | `/Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-sprint-forge-reader/ROADMAP.md` |
| Latest Sprint | `/Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-sprint-forge-reader/sprints/SPRINT-10-ai-instruction-layer.md` |
| Growth-CEO Strategy | `/Users/rperaza/joicodev/ideas/kyro/.agents/growth-ceo/strategic-overview.md` |

---

## Scenario 1 — Plan Next Phase (All 10 Sprints Complete)

All 10 planned sprints are complete. Kyro is at v3.0.0. Open debt: D21 (AI integration tests), D22 (action chaining), D23 (Sprint Forge page).

```
I'm continuing work on the kyro-sprint-forge-reader project. All 10 sprints are complete (v3.0.0).

Read these files in order:
1. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-sprint-forge-reader/README.md
2. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-sprint-forge-reader/ROADMAP.md
3. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-sprint-forge-reader/sprints/SPRINT-10-ai-instruction-layer.md (Retro, Recommendations, Debt table)
4. /Users/rperaza/joicodev/ideas/kyro/.agents/planning/markdown-architecture-evolution.md

Then use /sprint-forge to check status and discuss next steps — whether to add Sprint 11+ to the roadmap or start a new project phase.
```

---

## Scenario 2 — Execute Existing Sprint

Use when a sprint has been generated but not yet executed.

```
I'm continuing work on the kyro-sprint-forge-reader project.

Read these files in order:
1. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-sprint-forge-reader/README.md
2. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-sprint-forge-reader/ROADMAP.md
3. The sprint file to execute (check the sprints/ directory)

Then use /sprint-forge to execute the sprint.
```

---

## Scenario 3 — Check Project Status

```
I need a status report on the kyro-sprint-forge-reader project.

Read these files:
1. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-sprint-forge-reader/README.md
2. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-sprint-forge-reader/ROADMAP.md
3. All sprint files in /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-sprint-forge-reader/sprints/

Then use /sprint-forge to generate a status report showing: completed sprints (Phase 1 + Phase 2 progress), accumulated debt, metrics, and what's planned next.
```
