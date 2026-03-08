---
title: "kyro-evolution — Re-entry Prompts"
created: 2026-03-07
agents:
  - claude-opus-4-6
---

# kyro-evolution — Re-entry Prompts

> Last updated: 2026-03-07
> Current sprint: 2

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
| 2 | `sprints/SPRINT-2-e2e-ai-tests.md` | pending |
| 3 | `sprints/SPRINT-3-url-routing-ssr.md` | pending |
| 4 | `sprints/SPRINT-4-sqlite-index-file-watcher.md` | pending |
| 5 | `sprints/SPRINT-5-action-chaining.md` | pending |

---

## Dynamic Paths

| Resource | Path |
|----------|------|
| Codebase | `/Users/rperaza/joicodev/ideas/kyro` |
| Working Directory | `/Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-evolution` |
| Roadmap | `/Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-evolution/ROADMAP.md` |
| Latest Sprint | `/Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-evolution/sprints/SPRINT-1-ast-writer.md` |

---

## Scenario 1 — N/A (Sprint 1 completed)

Sprint 1 has been completed. Use Scenario 2 to generate Sprint 2.

---

## Scenario 2 — Next Sprint (Sprint 2)

Use this prompt to generate Sprint 2.

```
I'm continuing work on the kyro-evolution project. Sprint 1 (AST Writer) has been completed.

Read these files in order:
1. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-evolution/README.md
2. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-evolution/ROADMAP.md
3. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-evolution/sprints/SPRINT-1-ast-writer.md (pay attention to Retro, Recommendations, and Debt table)
4. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-evolution/findings/02-e2e-tests-outdated.md
5. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-evolution/findings/06-inherited-debt.md

Then use /sprint-forge to generate Sprint 2. Ensure all recommendations from Sprint 1
are addressed in the Disposition table.
```

---

## Scenario 3 — Execute Current Sprint

Use this prompt when a sprint has been generated but not yet executed.

```
I'm working on the kyro-evolution project. Sprint 2 has been generated and needs execution.

Read these files in order:
1. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-evolution/README.md
2. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-evolution/ROADMAP.md
3. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-evolution/sprints/SPRINT-2-e2e-ai-tests.md

Then use /sprint-forge to execute Sprint 2. Work through each phase and task,
marking progress as you go. Add emergent phases if new work is discovered.
```

---

## Scenario 4 — Check Project Status

Use this prompt to get a progress report.

```
I need a status report on the kyro-evolution project.

Read these files:
1. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-evolution/README.md
2. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-evolution/ROADMAP.md
3. All sprint files in /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-evolution/sprints/

Then use /sprint-forge to generate a status report showing: completed sprints,
accumulated debt, metrics, and what's planned next.
```
