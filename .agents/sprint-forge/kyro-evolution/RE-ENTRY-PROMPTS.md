---
title: "kyro-evolution — Re-entry Prompts"
created: 2026-03-07
agents:
  - claude-opus-4-6
---

# kyro-evolution — Re-entry Prompts

> Last updated: 2026-03-09
> Current sprint: 7 (completed) — all 7 roadmap sprints done
> Retrospective: Completed (full project retro, Sprints 1-7)

These prompts help you (or a new agent) recover full project context in a new session.

---

## Output Directory

```
/Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-evolution
```

This is where all sprint-forge documents for this project live. All file paths below are relative to this directory.

---

## Quick Reference

| Sprint | File | Status |
|--------|------|--------|
| 1 | `sprints/SPRINT-1-ast-writer.md` | completed |
| 2 | `sprints/SPRINT-2-e2e-ai-tests.md` | completed |
| 3 | `sprints/SPRINT-3-url-routing-ssr.md` | completed |
| 4 | `sprints/SPRINT-4-sqlite-index-file-watcher.md` | completed |
| 5 | `sprints/SPRINT-5-action-chaining.md` | completed |
| 6 | `sprints/SPRINT-6-debt-resolution-hardening.md` | completed |
| 7 | `sprints/SPRINT-7-forge-interactivity-board-enhancements.md` | completed |

---

## Dynamic Paths

| Resource | Path |
|----------|------|
| Codebase | `/Users/rperaza/joicodev/ideas/kyro` |
| Working Directory | `/Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-evolution` |
| Roadmap | `/Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-evolution/ROADMAP.md` |
| Latest Sprint | `/Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-evolution/sprints/SPRINT-7-forge-interactivity-board-enhancements.md` |
| Growth Strategy | `/Users/rperaza/joicodev/ideas/kyro/.agents/growth-ceo/q1-2026-growth/strategic-overview.md` |
| Learned Rules | `/Users/rperaza/joicodev/ideas/kyro/.kyro/rules.md` |

---

## Current State Summary

**Version**: 3.6.0 | **Tests**: 281 unit (24 files) + 30 E2E | **Type errors**: 0

**Open debt**: D8 (SSR migration — recommend closing as accepted), D9 (CLAUDE.md drift — ongoing)

**Strategic direction** (from `.agents/growth-ceo/q1-2026-growth/`):
- Initiative 1: Surgical Refinement Layer — inline editing of AI-generated content + correction tracking
- Initiative 2: Sprint Intelligence Graph — connection extractor + visual topology
- Initiative 3: Autonomous Sprint Agent — heuristic analysis + insights panel

**Key constraint** [RULE-003]: Sprints are AI-generated. Kyro reads and refines, never creates from scratch.

---

## Scenario 1 — Generate Sprint 8 (Next Sprint)

Use this prompt to generate the next sprint, aligned with the growth strategy.

```
I'm continuing work on the kyro-evolution project. All 7 roadmap sprints are completed (v3.6.0).

Read these files in order:
1. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-evolution/README.md
2. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-evolution/ROADMAP.md
3. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-evolution/sprints/SPRINT-7-forge-interactivity-board-enhancements.md (Retro, Recommendations, Debt table)
4. /Users/rperaza/joicodev/ideas/kyro/.agents/growth-ceo/q1-2026-growth/strategic-overview.md (strategic direction)
5. /Users/rperaza/joicodev/ideas/kyro/.agents/growth-ceo/q1-2026-growth/initiatives/0001-surgical-refinement-layer.md (Phase 1 scope)
6. /Users/rperaza/joicodev/ideas/kyro/.agents/growth-ceo/q1-2026-growth/initiatives/0002-sprint-intelligence-graph.md (Phase 1 scope)
7. /Users/rperaza/joicodev/ideas/kyro/.agents/growth-ceo/q1-2026-growth/initiatives/0003-autonomous-sprint-agent.md (Phase 1 scope)
8. /Users/rperaza/joicodev/ideas/kyro/.kyro/rules.md (learned rules)

Sprint 8 should be the Phase 1 wedge of the growth strategy:
- Inline task field editing (Surgical Refinement Layer — Phase 1)
- Connection extractor (Intelligence Graph — Phase 1)
- Sprint quality analyst with heuristic insights (Autonomous Agent — Phase 1)
- Close D8 as accepted design choice [RULE-002]
- Address Sprint 7 Recommendations in Disposition table

Then use /sprint-forge to generate Sprint 8. Version target: 3.7.0.
```

---

## Scenario 2 — Check Project Status

Use this prompt to get a progress report.

```
I need a status report on the kyro-evolution project.

Read these files:
1. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-evolution/README.md
2. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-evolution/ROADMAP.md
3. All sprint files in /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-evolution/sprints/
4. /Users/rperaza/joicodev/ideas/kyro/.agents/growth-ceo/q1-2026-growth/strategic-overview.md

Report: completed sprints, accumulated debt, test metrics, strategic alignment, and what's planned next.
```

---

## Scenario 3 — Run Retrospective

```
Run a retrospective on the kyro-evolution project.

Read:
1. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-evolution/ROADMAP.md
2. The latest completed sprint file
3. /Users/rperaza/joicodev/ideas/kyro/.kyro/rules.md

Then use /retro to run the retrospective ritual.
```
