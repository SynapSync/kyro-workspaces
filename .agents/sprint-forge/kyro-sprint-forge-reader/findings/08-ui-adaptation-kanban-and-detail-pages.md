---
title: "Finding: UI Adaptation — Kanban Board, Sprint Detail, and New Views"
date: "2026-03-05"
updated: "2026-03-06"
project: "kyro-sprint-forge-reader"
type: "analysis"
status: "active"
version: "1.0"
severity: "medium"
agents:
  - "claude-opus-4-6"
tags:
  - "kyro-sprint-forge-reader"
  - "analysis"
  - "finding"
  - "ui"
changelog:
  - version: "1.0"
    date: "2026-03-05"
    changes: ["Finding documented"]
related:
  - "[[ROADMAP]]"
---

# Finding: UI Adaptation — Kanban Board, Sprint Detail, and New Views

## Summary

Kyro's UI components (kanban board, sprint detail page, project overview, sidebar) are moderately coupled to the current flat data model. The sprint-forge model introduces phases, richer tasks, new sections, findings as a first-class entity, and a roadmap viewer. While the core component library (shadcn, dnd-kit) is reusable, several page-level components need significant adaptation and new views need to be created.

## Severity / Impact

**medium** — The UI work is substantial but not blocking. The parsing layer and types must be done first. UI changes build on top of correct data.

## Details

### Kanban Board Adaptations

**Current**: Flat `Sprint.tasks[]` displayed in columns by `TaskStatus`.

**Target**: Tasks grouped by `Phase`, with phase headers visible. Consider:
- Phase accordion/sections within the board view
- Phase progress indicator (3/5 tasks done)
- Emergent phase visual distinction (different border color)
- Task cards showing task ref ID (`T1.1`), files affected, verification status

**Component impact:**
- `SprintBoard` — needs phase-aware layout option
- `TaskCard` — needs to show taskRef, files badge, phase tag
- `BoardColumn` — mostly unchanged (still groups by status)

### Sprint Detail Page Adaptations

**Current**: 5 tabs (retrospective, technicalDebt, executionMetrics, findings, recommendations) with markdown editor per tab.

**Target**: 8+ tabs with some showing interactive content:
- **Disposition** tab — table with filterable action column
- **Phases** tab — phase list with progress and task status
- **Emergent Phases** tab — same as phases but flagged
- **Findings Consolidation** tab — table with impact sorting
- **Technical Debt** tab — table with status filtering and lifecycle tracking
- **Definition of Done** tab — interactive checklist
- **Retro** tab — markdown (unchanged)
- **Recommendations** tab — markdown (unchanged)

**Component impact:**
- `sprint-detail-page.tsx` — tab list expansion, conditional rendering per section type
- New components: `DebtTable`, `DispositionTable`, `FindingsTable`, `DoDChecklist`

### New Views Needed

| View | Description |
|---|---|
| **Findings Browser** | List all `findings/*.md` files with severity badges, linked sprints |
| **Roadmap Viewer** | Visualize sprint plan from ROADMAP.md — dependency graph, status, types |
| **Debt Dashboard** | Across-sprint debt tracking — open items, trend, origin analysis |
| **Project Onboarding** | "Add project" flow: paste/browse directory path, validate, name it |

### Sidebar Changes

Current sidebar nav items:
```typescript
NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "board", label: "Board", icon: Columns3 },
  { id: "sprints", label: "Sprints", icon: Zap },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "agents", label: "Agents", icon: Bot },
]
```

Target additions:
- **Findings** — navigate to findings browser
- **Roadmap** — navigate to roadmap viewer
- **Debt** — navigate to debt dashboard (or fold into existing overview)

### Project Creation Dialog

Current: Creates a new project with name + description → `mkdir` in workspace.
Target: "Add Project" dialog with:
- Directory path input (text field or file picker)
- Path validation (checks for README.md, sprints/ directory)
- Auto-detect project name from README heading
- Optional custom display name and color

## Affected Files

- `components/pages/sprint-board.tsx` — phase-aware layout
- `components/kanban/task-card.tsx` — richer task display
- `components/pages/sprint-detail-page.tsx` — expanded sections
- `components/pages/project-overview.tsx` — roadmap integration
- `components/pages/sprints-page.tsx` — sprint type badges
- `lib/config.ts` — `NAV_ITEMS`, `SPRINT_SECTIONS` expansion
- New components for findings browser, roadmap viewer, debt dashboard
- Sidebar component — new nav items
- Project creation dialog — directory picker flow

## Recommendations

1. Phase UI work after types + parsers are complete
2. Start with sprint detail page expansion (most value, least risk)
3. Add findings browser as a simple list view initially
4. Roadmap viewer can start as rendered markdown, evolve to interactive graph later
5. Kanban phase grouping can be a v2 enhancement — flat view works initially
6. Debt dashboard can reuse the debt table component from sprint detail
