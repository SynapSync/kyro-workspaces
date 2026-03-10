---
title: "kyro-graph-view -- Re-entry Prompts"
date: "2026-03-10"
updated: "2026-03-10"
project: "kyro-graph-view"
type: "execution-plan"
status: "completed"
version: "4.0"
agents:
  - "claude-opus-4-6"
tags:
  - "kyro-graph-view"
  - "execution-plan"
  - "reentry"
  - "kyro-workflow"
changelog:
  - version: "1.0"
    date: "2026-03-10"
    changes: ["Re-entry prompts created"]
  - version: "2.0"
    date: "2026-03-10"
    changes: ["Updated for Sprint 3 after Sprint 2 completion"]
  - version: "3.0"
    date: "2026-03-10"
    changes: ["Updated for Sprint 4 after Sprint 3 completion"]
  - version: "4.0"
    date: "2026-03-10"
    changes: ["Project completed -- all 4 sprints done, 0 open debt"]
related:
  - "[[README]]"
  - "[[ROADMAP]]"
---

# kyro-graph-view -- Re-entry Prompts

> Last updated: 2026-03-10
> Status: PROJECT COMPLETED -- all 4 sprints done

These prompts help you (or a new agent) recover full project context in a new session.

---

## Output Directory

```
/Users/rperaza/joicodev/ideas/kyro/.agents/kyro/sprints/kyro-graph-view
```

This is where all kyro-workflow documents for this project live. All file paths below are relative to this directory.

---

## Quick Reference

| Sprint | File | Status |
|--------|------|--------|
| 1 | `sprints/SPRINT-01-foundation.md` | completed |
| 2 | `sprints/SPRINT-02-interactive-ui.md` | completed |
| 3 | `sprints/SPRINT-03-filtering-clustering.md` | completed |
| 4 | `sprints/SPRINT-04-performance-testing.md` | completed |

---

## Dynamic Paths

| Resource | Path |
|----------|------|
| Codebase | `/Users/rperaza/joicodev/ideas/kyro` |
| Working Directory | `/Users/rperaza/joicodev/ideas/kyro/.agents/kyro/sprints/kyro-graph-view` |
| Roadmap | `/Users/rperaza/joicodev/ideas/kyro/.agents/kyro/sprints/kyro-graph-view/ROADMAP.md` |
| Latest Sprint | `/Users/rperaza/joicodev/ideas/kyro/.agents/kyro/sprints/kyro-graph-view/sprints/SPRINT-04-performance-testing.md` |

---

## Scenario 1 -- First Sprint (after INIT)

N/A -- All sprints completed.

---

## Scenario 2 -- Next Sprint

N/A -- All 4 planned sprints completed. The roadmap is fully executed. No open debt items remain.

If new work is needed on the Graph View feature:

```
I want to add enhancements to the kyro-graph-view project. All 4 sprints are completed.

Read these files in order:
1. /Users/rperaza/joicodev/ideas/kyro/.agents/kyro/sprints/kyro-graph-view/README.md
2. /Users/rperaza/joicodev/ideas/kyro/.agents/kyro/sprints/kyro-graph-view/ROADMAP.md
3. /Users/rperaza/joicodev/ideas/kyro/.agents/kyro/sprints/kyro-graph-view/sprints/SPRINT-04-performance-testing.md (see Recommendations for future ideas)

Key context:
- Graph uses `react-force-graph-2d` with `next/dynamic` (ssr: false)
- Graph components: components/graph/{graph-canvas,graph-controls,graph-filters,graph-legend,graph-minimap,graph-tooltip}.tsx
- Pure logic in lib/graph-utils.ts (isNodeVisible, isNodeHighlighted, computeVisibleNodeIds)
- graph-canvas.tsx uses local NODE_COLORS (not imported from config)
- Filter state: GraphFilterState { hiddenTypes, selectedTags, searchQuery }
- visibleNodeIds Set for O(1) link visibility, position fingerprint for cluster label throttling
- SSE auto-refresh: useRealtimeSync calls loadGraph with 500ms debounce
- 0 open debt items, 358 unit tests, 5 E2E tests for graph view
```

---

## Scenario 3 -- Execute Current Sprint

N/A -- All sprints executed.

---

## Scenario 4 -- Check Project Status

Use this prompt to get a progress report.

```
I need a status report on the kyro-graph-view project.

Read these files:
1. /Users/rperaza/joicodev/ideas/kyro/.agents/kyro/sprints/kyro-graph-view/README.md
2. /Users/rperaza/joicodev/ideas/kyro/.agents/kyro/sprints/kyro-graph-view/ROADMAP.md
3. All sprint files in /Users/rperaza/joicodev/ideas/kyro/.agents/kyro/sprints/kyro-graph-view/sprints/

Then use /kyro-workflow to generate a status report showing: completed sprints,
accumulated debt, metrics, and what's planned next.
```
