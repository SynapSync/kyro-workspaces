---
title: "kyro-sprint-forge-reader — Working Project"
date: "2026-03-05"
updated: "2026-03-07"
project: "kyro-sprint-forge-reader"
type: "progress"
status: "active"
version: "2.0"
agents:
  - "claude-opus-4-6"
tags:
  - "kyro-sprint-forge-reader"
  - "progress"
  - "sprint-forge"
changelog:
  - version: "2.0"
    date: "2026-03-07"
    changes: ["Phase 2 plan — growth-ceo initiatives (sprints 7-10), new findings 09-11"]
  - version: "1.0"
    date: "2026-03-05"
    changes: ["Project initialized"]
related:
  - "[[ROADMAP]]"
  - "[[RE-ENTRY-PROMPTS]]"
---

# kyro-sprint-forge-reader — Working Project

> Type: feature
> Created: 2026-03-05
> Codebase: `/Users/rperaza/joicodev/ideas/kyro`

---

## What Is This

This directory contains the working artifacts for building Kyro — the AI-native cockpit for sprint-driven development.

**Phase 1 (completed, v1.1.0)**: Transformed Kyro from a self-contained project management tool into a native reader/viewer for sprint-forge project directories. Parsing layer, API routes, service layer, UI components, and markdown rendering pipeline — all completed across 6 sprints.

**Phase 2 (in progress, target v3.0.0)**: Transforming Kyro from a passive viewer into an active command center. Universal search, kanban persistence, write actions, sprint-forge trigger, and AI instruction layer — planned across 4 sprints based on approved growth-ceo strategic initiatives.

It is managed by the `sprint-forge` skill and follows an adaptive sprint workflow.

---

## For AI Agents — Mandatory Reading Order

If you are an AI agent resuming work on this project, read these files in order:

1. **This README** — You are here. Understand the project structure.
2. **ROADMAP.md** — The adaptive roadmap with all planned sprints and execution rules. Focus on the **Phase 2** section for current work.
3. **Last completed sprint** — `sprints/SPRINT-6-markdown-rendering-pipeline.md`. Read its retro, recommendations, and debt table.
4. **RE-ENTRY-PROMPTS.md** — Pre-written prompts for common actions. Copy the appropriate scenario.
5. **Growth-CEO strategy** — `.agents/growth-ceo/strategic-overview.md` for the strategic vision driving Phase 2.

---

## Directory Structure

```
/Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-sprint-forge-reader/
├── README.md              <- This file
├── ROADMAP.md             <- Adaptive roadmap (living document)
├── RE-ENTRY-PROMPTS.md    <- Context recovery prompts
├── findings/              <- Analysis findings (one file per area)
│   ├── 01-sprint-file-format-incompatibility.md
│   ├── 02-task-format-and-phase-structure.md
│   ├── 03-project-model-external-directories.md
│   ├── 04-missing-domain-concepts.md
│   ├── 05-sprint-sections-expansion.md
│   ├── 06-roadmap-and-readme-parsing.md
│   ├── 07-workspace-config-and-project-registry.md
│   ├── 08-ui-adaptation-kanban-and-detail-pages.md
│   ├── 09-live-search-and-cross-project-intelligence.md       <- Phase 2
│   ├── 10-command-bar-structured-actions-and-kanban-persistence.md  <- Phase 2
│   └── 11-sprint-forge-trigger-from-kyro.md                   <- Phase 2
└── sprints/               <- Sprint documents (generated one at a time)
    ├── SPRINT-1-domain-types-and-parsers.md                   (completed)
    ├── SPRINT-2-project-registry-and-api-refactor.md          (completed)
    ├── SPRINT-3-service-layer-and-store-adaptation.md         (completed)
    ├── SPRINT-4-ui-adaptation.md                              (completed)
    ├── SPRINT-5-new-views-e2e-and-polish.md                   (completed)
    └── SPRINT-6-markdown-rendering-pipeline.md                (completed)
```

---

## Absolute Paths

| Resource | Path |
|----------|------|
| Codebase | `/Users/rperaza/joicodev/ideas/kyro` |
| Working Directory | `/Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-sprint-forge-reader` |
| Findings | `/Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-sprint-forge-reader/findings/` |
| Sprints | `/Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-sprint-forge-reader/sprints/` |
| Roadmap | `/Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-sprint-forge-reader/ROADMAP.md` |
| Re-entry Prompts | `/Users/rperaza/joicodev/ideas/kyro/.agents/sprint-forge/kyro-sprint-forge-reader/RE-ENTRY-PROMPTS.md` |
| Growth-CEO Strategy | `/Users/rperaza/joicodev/ideas/kyro/.agents/growth-ceo/strategic-overview.md` |

---

## Sprint System Rules

1. Sprints are generated **one at a time** — never pre-generated
2. Each sprint feeds from the previous sprint's retro and recommendations
3. The accumulated debt table passes from sprint to sprint, never losing items
4. The roadmap adapts based on what execution reveals
5. Re-entry prompts are updated after each sprint for context persistence

---

## Current State (post Phase 1)

| Metric | Value |
|--------|-------|
| Version | 1.1.0 (Phase 1 complete) |
| Next.js | 16.1.6 |
| React | 19.2.4 |
| TypeScript | 5.7.3 |
| Zustand | 5.0.2 |
| Tailwind CSS | 4.2.0 |
| shadcn/ui components | ~18 (trimmed from 60+) |
| Custom components | ~25 page/feature/sprint components |
| API routes | 17 route handlers (some unused — task/document CRUD) |
| Service interfaces | 3 (ProjectsService, MembersService, ActivitiesService) |
| Parsers | 11 (sprint-forge, finding, roadmap, readme, debt, disposition, markdown-utils, registry, etc.) |
| Unit tests | 112 passing (Vitest 4.0.18) |
| E2E tests | Playwright 1.58.2 (Chromium, headless) |
| Open technical debt | D1 (logo hardcoded), D17 (no React component testing) |

---

## Sprint Map

### Phase 1 — Reader (completed, v1.1.0)

| Sprint | Status | Focus | Key Deliverables |
|--------|--------|-------|-----------------|
| 1 | completed | Domain types & sprint-forge parsers | Zod schemas, sprint/task/finding parsers, markdown utilities |
| 2 | completed | Project registry & API refactor | projects.json, external dir support, API route updates |
| 3 | completed | Service layer & store adaptation | Service contracts, file services, Zustand store, mock data |
| 4 | completed | UI adaptation | Sprint detail expansion, kanban updates, project creation flow |
| 5 | completed | New views, E2E & polish | Findings browser, roadmap viewer, debt dashboard, E2E tests |
| 6 | completed | Markdown rendering pipeline | MarkdownRenderer, typography, GFM, syntax highlighting |

### Phase 2 — Cockpit (growth-ceo initiatives, target v3.0.0)

| Sprint | Status | Focus | Key Deliverables |
|--------|--------|-------|-----------------|
| 7 | pending | Universal search & Cmd+K | Search index, fuzzy matching, grouped results, topbar integration |
| 8 | pending | Kanban persistence & write actions | Task mutations, drag-drop persistence, Cmd+K actions, git safety |
| 9 | pending | Sprint Forge trigger | Context assembler, prompt composer, generation wizard, project refresh |
| 10 | pending | AI instruction layer | AI interpret route, smart Cmd+K, forge generate route, action chaining |
