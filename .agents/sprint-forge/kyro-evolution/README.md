---
title: "kyro-evolution — Working Project"
created: 2026-03-07
agents:
  - claude-opus-4-6
---

# kyro-evolution — Working Project

> Type: Audit / Refactor (architectural evolution)
> Created: 2026-03-07
> Codebase: `/Users/rperaza/joicodev/ideas/kyro`

---

## What Is This

This directory contains the working artifacts for the architectural evolution of Kyro (successor to `kyro-sprint-forge-reader` v3.0.0). The project addresses two critical architectural gaps — fragile regex-based writes and O(n) cross-file queries — while adding URL routing, comprehensive tests, and AI action chaining. It is managed by the `sprint-forge` skill and follows an adaptive sprint workflow.

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
/Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-evolution/
├── README.md              <- This file
├── ROADMAP.md             <- Adaptive roadmap (living document)
├── RE-ENTRY-PROMPTS.md    <- Context recovery prompts
├── findings/              <- Analysis findings (one file per area)
│   ├── 01-ast-writer-regex-replacement.md
│   ├── 02-e2e-tests-outdated.md
│   ├── 03-url-routing-ssr.md
│   ├── 04-sqlite-index-file-watcher.md
│   ├── 05-action-chaining.md
│   └── 06-inherited-debt.md
└── sprints/               <- Sprint documents (generated one at a time)
```

---

## Absolute Paths

| Resource | Path |
|----------|------|
| Codebase | `/Users/rperaza/joicodev/ideas/kyro` |
| Working Directory | `/Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-evolution` |
| Findings | `/Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-evolution/findings/` |
| Sprints | `/Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-evolution/sprints/` |
| Roadmap | `/Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-evolution/ROADMAP.md` |
| Re-entry Prompts | `/Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-evolution/RE-ENTRY-PROMPTS.md` |
| Closure Plan (source) | `/Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/closure-plan.md` |
| Predecessor Project | `/Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-sprint-forge-reader/` |

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
| Predecessor version | 3.0.0 |
| Predecessor sprints | 10/10 completed |
| Tests | 147 passing (18 files) |
| Type errors | 0 |
| Build | Clean |
| Source files | 141 (.ts/.tsx) |
| Lines of code | ~16,700 |
| Inherited debt | D21, D22, D23, C3 (none blocking) |
| Resolved debt (predecessor) | 20/23 |

---

## Sprint Map

| Sprint | Status | Focus | Key Deliverables |
|--------|--------|-------|-----------------|
| 1 | completed | AST Writer | `lib/file-format/ast-writer.ts` — hybrid AST+positional replacement, 4 functions, 32 tests |
| 2 | completed | E2E + AI Tests | Restored Playwright suite (30 tests), AI integration tests (D21) — 193 unit + 30 E2E tests |
| 3 | completed | SSR Data Fetching & Consolidation | Server Components, D6/D7 fixes, updateFrontmatterField(), CLAUDE.md update |
| 4 | completed | SQLite Index + File Watcher | SQLite derived index (7 tables, 4 FTS5), file watcher, SSE push, 243 unit tests |
| 5 | active | Action Chaining | Multi-step AI chains from Cmd+K (D22) |
