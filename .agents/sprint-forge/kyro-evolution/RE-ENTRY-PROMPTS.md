---
title: "kyro-evolution — Re-entry Prompts"
created: 2026-03-07
agents:
  - claude-opus-4-6
---

# kyro-evolution — Re-entry Prompts

> Last updated: 2026-03-08
> Current sprint: 5 (generated, pending execution)

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
| 5 | `sprints/SPRINT-5-action-chaining.md` | active |

---

## Dynamic Paths

| Resource | Path |
|----------|------|
| Codebase | `/Users/rperaza/joicodev/ideas/kyro` |
| Working Directory | `/Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-evolution` |
| Roadmap | `/Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-evolution/ROADMAP.md` |
| Latest Sprint | `/Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-evolution/sprints/SPRINT-5-action-chaining.md` |

---

## Scenario 1 — Next Sprint (Sprint 6)

Use this prompt after Sprint 5 is completed to generate Sprint 6.

```
I'm continuing work on the kyro-evolution project. Sprint 5 (Action Chaining) has been completed.

Read these files in order:
1. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-evolution/README.md
2. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-evolution/ROADMAP.md
3. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-evolution/sprints/SPRINT-5-action-chaining.md (pay attention to Retro, Recommendations, and Debt table)

Then use /sprint-forge to generate Sprint 6. Ensure all recommendations from Sprint 5
are addressed in the Disposition table.
```

---

## Scenario 2 — Execute Sprint 5

Use this prompt after Sprint 5 is generated.

```
I'm working on the kyro-evolution project. Sprint 5 has been generated and needs execution.

Read these files in order:
1. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-evolution/README.md
2. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-evolution/ROADMAP.md
3. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-evolution/sprints/SPRINT-5-action-chaining.md

Then use /sprint-forge to execute Sprint 5. Work through each phase and task,
marking progress as you go. Add emergent phases if new work is discovered.
```

---

## Scenario 3 — Check Project Status

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
