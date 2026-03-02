# kyro-mock-data-migration — Working Project

> Type: Tech Debt / Architecture Prep
> Created: 2026-02-28
> Codebase: `/Users/rperaza/joicodev/ideas/kyro`

---

## What Is This

This directory contains the working artifacts for the **mock data architecture migration** of the Kyro project. The goal is to properly organize all hardcoded/static data into a structured mock data layer and prepare the architecture for eventual real backend integration.

Managed by the `sprint-forge` skill — adaptive sprint workflow.

---

## For AI Agents — Mandatory Reading Order

If you are an AI agent resuming work on this project, read these files in order:

1. **This README** — You are here. Understand the project structure.
2. **ROADMAP.md** — The adaptive roadmap with all planned sprints and execution rules.
3. **Last completed sprint** — The most recent sprint file in `sprints/`. Read its retro, recommendations, and debt table.
4. **RE-ENTRY-PROMPTS.md** — Pre-written prompts for common actions. Copy the appropriate one.

---

## Directory Structure

```
.agents/sprint-forge/kyro-mock-data-migration/
├── README.md              ← This file
├── ROADMAP.md             ← Adaptive roadmap (living document)
├── RE-ENTRY-PROMPTS.md    ← Context recovery prompts
├── findings/              ← Analysis findings (one file per area)
│   ├── 01-ui-constants-scattered.md
│   ├── 02-store-missing-entities.md
│   ├── 03-no-data-service-layer.md
│   ├── 04-store-no-async-states.md
│   └── 05-no-api-contract.md
└── sprints/               ← Sprint documents (generated one at a time)
    └── (sprints generated as executed)
```

---

## Absolute Paths

| Resource | Path |
|----------|------|
| Codebase | `/Users/rperaza/joicodev/ideas/kyro` |
| Working Directory | `/Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-mock-data-migration` |
| Findings | `/Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-mock-data-migration/findings/` |
| Sprints | `/Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-mock-data-migration/sprints/` |
| Roadmap | `/Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-mock-data-migration/ROADMAP.md` |
| Re-entry Prompts | `/Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-mock-data-migration/RE-ENTRY-PROMPTS.md` |

---

## Sprint System Rules

1. Sprints are generated **one at a time** — never pre-generated
2. Each sprint feeds from the previous sprint's retro and recommendations
3. The accumulated debt table passes from sprint to sprint, never losing items
4. The roadmap adapts based on what execution reveals
5. Re-entry prompts are updated after each sprint for context persistence

---

## Current State — Baseline

| Metric | Value |
|--------|-------|
| Total files | ~35 source files |
| State management | Zustand 5.0.2 (client-side only) |
| Data source | `lib/mock-data.ts` + `lib/store.ts` |
| Backend integration | None (0% — fully mock) |
| Persistence | None (session-only state) |
| Data entities in store | Projects, Activities (TeamMembers missing) |
| UI constants in dedicated config | 0 of 4 (all scattered) |
| Async state support | None |
| API contract defined | None |

---

## Sprint Map

| Sprint | Status | Focus | Key Deliverables |
|--------|--------|-------|-----------------|
| 1 | pending | Extract UI constants to config | `lib/config.ts`, `lib/auth.ts` (mock user) |
| 2 | pending | Complete store entities | TeamMember type + store state + actions |
| 3 | pending | Data service layer | `lib/services/` with mock implementations + feature flag |
| 4 | pending | Async store + API contract | Loading/error states + `lib/api/` scaffold |
