---
title: "kyro-graph-view -- Working Project"
date: "2026-03-10"
updated: "2026-03-10"
project: "kyro-graph-view"
type: "progress"
status: "active"
version: "1.0"
agents:
  - "claude-opus-4-6"
tags:
  - "kyro-graph-view"
  - "progress"
  - "kyro-workflow"
changelog:
  - version: "1.0"
    date: "2026-03-10"
    changes: ["Project initialized"]
related:
  - "[[ROADMAP]]"
  - "[[RE-ENTRY-PROMPTS]]"
---

# kyro-graph-view -- Working Project

> Type: feature
> Created: 2026-03-10
> Codebase: `/Users/rperaza/joicodev/ideas/kyro`

---

## What Is This

This directory contains the working artifacts for designing and implementing a node-based knowledge visualization system (Graph View) for Kyro. Each markdown file in a project becomes a node, links between files become edges. The graph is automatically derived from project files (not manually maintained) and rendered as an interactive UI with zoom, pan, filter, and clustering capabilities.

---

## For AI Agents -- Mandatory Reading Order

If you are an AI agent resuming work on this project, read these files in order:

1. **This README** -- You are here. Understand the project structure.
2. **ROADMAP.md** -- The adaptive roadmap with all planned sprints and execution rules.
3. **Last completed sprint** -- The most recent sprint file in `sprints/`. Read its retro, recommendations, and debt table.
4. **RE-ENTRY-PROMPTS.md** -- Pre-written prompts for common actions. Copy the appropriate one.

---

## Directory Structure

```
/Users/rperaza/joicodev/ideas/kyro/.agents/kyro/sprints/kyro-graph-view/
  README.md              -- This file
  ROADMAP.md             -- Adaptive roadmap (living document)
  RE-ENTRY-PROMPTS.md    -- Context recovery prompts
  findings/              -- Analysis findings (one file per area)
    01-graph-data-model.md
    02-markdown-link-parsing.md
    03-sqlite-graph-storage.md
    04-graph-builder.md
    05-interactive-graph-ui.md
    06-api-route-and-service.md
    07-route-nav-integration.md
  sprints/               -- Sprint documents (generated one at a time)
```

---

## Absolute Paths

| Resource | Path |
|----------|------|
| Codebase | `/Users/rperaza/joicodev/ideas/kyro` |
| Working Directory | `/Users/rperaza/joicodev/ideas/kyro/.agents/kyro/sprints/kyro-graph-view` |
| Findings | `/Users/rperaza/joicodev/ideas/kyro/.agents/kyro/sprints/kyro-graph-view/findings/` |
| Sprints | `/Users/rperaza/joicodev/ideas/kyro/.agents/kyro/sprints/kyro-graph-view/sprints/` |
| Roadmap | `/Users/rperaza/joicodev/ideas/kyro/.agents/kyro/sprints/kyro-graph-view/ROADMAP.md` |
| Re-entry Prompts | `/Users/rperaza/joicodev/ideas/kyro/.agents/kyro/sprints/kyro-graph-view/RE-ENTRY-PROMPTS.md` |

---

## Sprint System Rules

1. Sprints are generated **one at a time** -- never pre-generated
2. Each sprint feeds from the previous sprint's retro and recommendations
3. The accumulated debt table passes from sprint to sprint, never losing items
4. The roadmap adapts based on what execution reveals
5. Re-entry prompts are updated after each sprint for context persistence

---

## Current State -- Baseline

| Metric | Value |
|--------|-------|
| Existing pages | 12 routes |
| Existing nav items | 10 |
| SQLite tables | 7 (projects, sprints, tasks, findings, debt_items, documents, file_checksums) |
| FTS5 tables | 4 (tasks_fts, findings_fts, documents_fts, sprints_fts) |
| Existing parsers | 6 (project readme, sprint, sprint-forge, finding, document, workspace config) |
| Unit tests | 281+ |
| E2E tests | 30+ |
| Dependencies (graph-related) | None yet (d3-force to be added) |

---

## Sprint Map

| Sprint | Status | Focus | Key Deliverables |
|--------|--------|-------|-----------------|
| 1 | pending | Foundation | Types, parser, SQLite storage, builder, API route, page skeleton |
| 2 | pending | Interactive UI | d3-force rendering, zoom/pan, click-to-navigate, tooltips |
| 3 | pending | Filtering & Real-time | Filter panel, clustering, SSE integration, minimap |
| 4 | pending | Polish & Performance | Performance, tests, accessibility |
