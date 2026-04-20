---
title: "Finding: Interactive Graph UI Component"
date: "2026-03-10"
updated: "2026-03-10"
project: "kyro-graph-view"
type: "analysis"
status: "active"
version: "1.0"
severity: "high"
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

# Finding: Interactive Graph UI Component

## Summary

A React component for rendering an interactive force-directed graph with zoom, pan, click-to-navigate, filtering, and clustering. Must integrate with Kyro's existing UI architecture (React 19, Zustand, Tailwind, shadcn/ui, App Router).

## Severity / Impact

high -- This is the user-facing deliverable. Library choice and component architecture affect bundle size, performance, and maintainability.

## Details

### Library Evaluation

| Library | Pros | Cons | Bundle Size |
|---------|------|------|-------------|
| **@xyflow/react** (React Flow) | React-native, great DX, built-in minimap/controls, TypeScript | Designed for flowcharts not knowledge graphs, limited force layout | ~120KB |
| **d3-force + React** | Most flexible, best force simulation, no React wrapper overhead | Manual React integration, complex state management | ~30KB (d3-force only) |
| **sigma.js** | Purpose-built for large graphs, WebGL rendering, very fast | Less React-native, different styling paradigm | ~90KB |
| **reagraph** | React + Three.js, 3D support, built for knowledge graphs | Heavy (Three.js), less mature | ~500KB+ |

**Recommendation: d3-force + custom React rendering** -- Kyro already uses framer-motion and custom SVG (VelocityChart, DebtTrendChart in sprint-analytics.tsx). A d3-force simulation with React SVG rendering keeps the stack minimal and gives full control over styling via Tailwind CSS tokens.

### Component Architecture

```
components/graph/
  graph-canvas.tsx      -- Main SVG canvas with zoom/pan (React + d3-force)
  graph-node.tsx        -- Individual node rendering (circle + label)
  graph-edge.tsx        -- Edge line rendering (with arrow heads)
  graph-controls.tsx    -- Zoom buttons, reset, fullscreen
  graph-filters.tsx     -- Filter panel (by type, tags, search)
  graph-minimap.tsx     -- Minimap overview (optional, Sprint 2+)
  graph-tooltip.tsx     -- Hover tooltip with file metadata
```

### Interaction Requirements

1. **Zoom/Pan**: d3-zoom on the SVG container, controlled via React state
2. **Click-to-Navigate**: Click node -> `router.push()` to the file's Kyro route
3. **Hover**: Show tooltip with file title, type, tag count, edge count
4. **Filter**: Toggle node types on/off, filter by tag, search by name
5. **Drag**: Drag nodes to reposition (d3-force allows pinning)
6. **Clustering**: Visual grouping by directory, type, or tag (convex hulls or background colors)

### Integration Points

- Use `router.push()` from `next/navigation` for click-to-navigate (existing pattern)
- Node colors from `lib/config.ts` constants (follow existing SPRINT_TYPE_COLORS pattern)
- Responsive: works in the main content area (flex-1 with min-h-0 scroll pattern)
- Dark mode: use CSS variables from globals.css

## Affected Files

- `components/graph/` (new directory) -- All graph UI components
- `components/pages/graph-page.tsx` (new) -- Page component
- `app/(workspace)/[projectId]/graph/page.tsx` (new) -- Route

## Recommendations

1. Use d3-force for simulation, React SVG for rendering (smallest footprint, full control)
2. Use `useRef` for the simulation, `useState` for node positions (re-render on tick)
3. Debounce simulation ticks to avoid excessive re-renders (requestAnimationFrame)
4. Follow existing component patterns: named exports, "use client", @/ imports
5. Start with basic zoom/pan/click in Sprint 1, add filters/clustering in Sprint 2
