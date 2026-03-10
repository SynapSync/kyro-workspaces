---
title: "Finding: Route & Navigation Integration"
date: "2026-03-10"
updated: "2026-03-10"
project: "kyro-graph-view"
type: "analysis"
status: "active"
version: "1.0"
severity: "medium"
agents:
  - "claude-opus-4-6"
tags:
  - "kyro-graph-view"
  - "analysis"
  - "finding"
changelog:
  - version: "1.0"
    date: "2026-03-10"
    changes: ["Finding documented"]
related:
  - "[[ROADMAP]]"
---

# Finding: Route & Navigation Integration

## Summary

The graph view needs a new route at `/(workspace)/[projectId]/graph`, a nav item in the sidebar, integration with the command palette, and breadcrumb support. All follow existing patterns.

## Severity / Impact

medium -- Straightforward extension of existing routing infrastructure. Low risk.

## Details

### Route Setup

Following the established pattern:
1. Create `app/(workspace)/[projectId]/graph/page.tsx` -- renders `GraphViewPage`
2. Create `components/pages/graph-view-page.tsx` -- "use client" page component
3. No layout needed (uses parent ProjectLayout)

### Navigation

Add to `NAV_ITEMS` in `lib/config.ts`:
```typescript
{ id: "graph", label: "Graph View", icon: Network, href: "/graph" }
```

`Network` icon from lucide-react is the best match for a graph/network visualization.

Position in sidebar: after "Documents", before "Re-entry Prompts" (content visualization belongs near content pages).

### Command Palette

The command palette auto-generates navigation commands from `NAV_ITEMS`, so adding the nav item is sufficient.

### Breadcrumb

The `app-topbar.tsx` derives breadcrumbs from URL pathname segments. The segment `graph` will automatically appear. No special handling needed.

### Search Integration

Graph nodes could appear in search results, but this is Sprint 2+ scope. The existing `searchIndex()` FTS5 system could be extended to include graph-specific searches.

## Affected Files

- `app/(workspace)/[projectId]/graph/page.tsx` (new)
- `components/pages/graph-view-page.tsx` (new)
- `lib/config.ts` -- Add nav item

## Recommendations

1. Use `Network` icon from lucide-react
2. Place graph nav item between "Documents" and "Re-entry Prompts"
3. Follow the page component pattern: named export, "use client" directive
4. Page uses `overflow-hidden` (graph manages its own viewport)
