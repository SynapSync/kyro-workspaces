# kyro-mock-data-migration — Re-entry Prompts

> Last updated: 2026-02-28
> MIGRACIÓN COMPLETA — 4/4 sprints ejecutados

These prompts help you (or a new agent) recover full project context in a new session.

---

## Quick Reference

| Sprint | File | Status |
|--------|------|--------|
| 1 | `sprints/SPRINT-1-ui-config.md` | completed |
| 2 | `sprints/SPRINT-2-store-entities.md` | completed |
| 3 | `sprints/SPRINT-3-service-layer.md` | completed |
| 4 | `sprints/SPRINT-4-async-api.md` | completed |

---

## Dynamic Paths

| Resource | Path |
|----------|------|
| Codebase | `/Users/rperaza/joicodev/ideas/kyro` |
| Working Directory | `/Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-mock-data-migration` |
| Roadmap | `/Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-mock-data-migration/ROADMAP.md` |
| Latest Sprint | `/Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-mock-data-migration/sprints/SPRINT-3-service-layer.md` |

---

## Scenario 1 — First Sprint (after INIT)

> **N/A — Sprint 1 completed on 2026-02-28.**
> Use Scenario 2 to continue with Sprint 2.

---

## Scenario 2 — Next Sprint (Sprint N)

Use this prompt when Sprint N-1 is complete and you need to generate Sprint N.

```
I'm continuing work on the kyro-mock-data-migration project. Sprint {N-1} has been completed.

Read these files in order:
1. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-mock-data-migration/README.md
2. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-mock-data-migration/ROADMAP.md
3. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-mock-data-migration/sprints/{last_sprint_file} (pay attention to Retro, Recommendations, and Debt table)
4. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-mock-data-migration/findings/{next_finding_file}

Then use /sprint-forge to generate Sprint {N}. Ensure all recommendations from Sprint {N-1}
are addressed in the Disposition table.
```

**Sprint sequence for filling the template:**

| Sprint N | last_sprint_file | next_finding_file |
|----------|-----------------|-------------------|
| 2 | `SPRINT-1-ui-config.md` | `02-store-missing-entities.md` |
| 3 | `SPRINT-2-store-entities.md` | `03-no-data-service-layer.md` |
| 4 | `SPRINT-3-service-layer.md` | `04-store-no-async-states.md` + `05-no-api-contract.md` |

---

## Scenario 3 — Execute Current Sprint

Use this prompt when a sprint has been generated but not yet executed.

```
I'm working on the kyro-mock-data-migration project. Sprint {N} has been generated and needs execution.

Read these files in order:
1. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-mock-data-migration/README.md
2. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-mock-data-migration/ROADMAP.md
3. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-mock-data-migration/sprints/{current_sprint_file}

Then use /sprint-forge to execute Sprint {N}. Work through each phase and task,
marking progress as you go. Add emergent phases if new work is discovered.
```

---

## Scenario 4 — Check Project Status

Use this prompt to get a progress report.

```
I need a status report on the kyro-mock-data-migration project.

Read these files:
1. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-mock-data-migration/README.md
2. /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-mock-data-migration/ROADMAP.md
3. All sprint files in /Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-mock-data-migration/sprints/

Then use /sprint-forge to generate a status report showing: completed sprints,
accumulated debt, metrics, and what's planned next.
```
