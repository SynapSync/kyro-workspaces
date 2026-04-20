---
title: "Sprint 2 -- Interactive Graph UI"
date: "2026-03-10"
updated: "2026-03-10"
project: "kyro-graph-view"
type: "sprint-plan"
status: "completed"
version: "1.1"
sprint: 2
progress: 100
prev_doc: "[[SPRINT-01-foundation]]"
next_doc: "[[SPRINT-03-filtering-clustering]]"
parent_doc: "[[ROADMAP]]"
agents:
  - "claude-opus-4-6"
tags:
  - "kyro-graph-view"
  - "sprint-plan"
  - "sprint-2"
changelog:
  - version: "1.0"
    date: "2026-03-10"
    changes: ["Sprint generated"]
  - version: "1.1"
    date: "2026-03-10"
    changes: ["Sprint completed -- all 16 tasks done"]
related:
  - "[[ROADMAP]]"
  - "[[SPRINT-01-foundation]]"
  - "[[05-interactive-graph-ui]]"
---

# Sprint 2 -- Interactive Graph UI

> Source: `findings/05-interactive-graph-ui.md`
> Previous Sprint: `SPRINT-01-foundation.md` (completed)
> Version Target: 4.1.0
> Type: feature
> Carry-over: 0 items from previous sprint
> Execution Date: 2026-03-10
> Executed By: claude-opus-4-6

---

## Sprint Objective

Replace the placeholder graph card with a fully interactive force-directed graph visualization using `react-force-graph-2d`. Users will see their project knowledge graph rendered as an interactive canvas with color-coded nodes, styled edges, zoom/pan controls, hover highlights, click-to-navigate, and a legend panel. The summary cards from Sprint 1 are preserved as a collapsible header above the graph canvas.

---

## Disposition of Previous Sprint Recommendations

| # | Recommendation | Disposition | Rationale |
|---|---------------|-------------|-----------|
| R1 | Use `react-force-graph-2d` library for interactive graph rendering | **ACCEPT** -- T1.1 | Core library for this sprint. Confirmed as user preference. |
| R2 | Add unit tests for `graph-builder.ts` before building interactive UI | **DEFER** to Sprint 4 | Sprint 4 is dedicated to testing. Building the UI first provides clearer test requirements. D2 remains open. |
| R3 | Replace placeholder card with react-force-graph-2d canvas; keep summary cards as collapsible header | **ACCEPT** -- T2.1, T2.2 | Summary cards become a collapsible panel above the graph canvas. |
| R4 | Add "Refresh Graph" button since SSE auto-refresh is Sprint 3 | **ACCEPT** -- T4.4 | Manual refresh button added to controls panel. |
| R5 | Use `GRAPH_NODE_HEX_COLORS` for react-force-graph-2d's `nodeColor` prop | **ACCEPT** -- T2.3 | Hex colors already prepared in config.ts for this exact purpose. |

---

## Phases

### Phase 1 -- Library Setup & Canvas Wrapper

**Objective**: Install `react-force-graph-2d`, create the foundational graph canvas component with dynamic import (the library uses Canvas 2D which requires browser APIs), and set up the component directory structure.

**Tasks**:

- [x] **T1.1**: Install `react-force-graph-2d` as a dependency
  - Command: `pnpm add react-force-graph-2d`
  - Evidence: `react-force-graph-2d@1.29.1` added to `package.json` dependencies. Installed with 38 transitive packages.
  - Verification: Package in `package.json` dependencies, `pnpm install` succeeds

- [x] **T1.2**: Create `components/graph/graph-canvas.tsx` -- wrapper component that dynamically imports `react-force-graph-2d` (via `next/dynamic` with `ssr: false`) and renders the force graph with basic props (`graphData`, `width`, `height`)
  - Files: `components/graph/graph-canvas.tsx`
  - Evidence: Component uses `next/dynamic` with `ssr: false` for the import. Accepts `GraphData` from store and transforms to `{ nodes: GraphNodeDatum[], links: GraphLinkDatum[] }` format. Uses `forwardRef` + `useImperativeHandle` to expose zoom/unpin controls to parent. All callbacks accept `NodeObject`/`LinkObject` base types and cast to our datum types internally to avoid dynamic import generic erasure.
  - Verification: TypeScript compiles cleanly (0 new errors)

- [x] **T1.3**: Create `components/graph/index.ts` barrel export for all graph components
  - Files: `components/graph/index.ts`
  - Evidence: Exports `GraphCanvas`, `GraphCanvasHandle`, `GraphControls`, `GraphLegend`.
  - Verification: All graph components importable from `@/components/graph`

### Phase 2 -- Node & Edge Rendering

**Objective**: Configure node rendering with type-based colors, labels, and sizing. Configure edge rendering with type-based styles. Support dark mode via CSS variables.

**Tasks**:

- [x] **T2.1**: Restructure `graph-view-page.tsx` -- move summary cards into a collapsible section (using a simple toggle), place the graph canvas below as the primary content area taking remaining viewport height
  - Files: `components/pages/graph-view-page.tsx`
  - Evidence: Summary cards controlled by `statsOpen` state with "Show Stats" / "Hide Stats" toggle button. Graph canvas uses `flex-1 min-h-0` pattern. ResizeObserver tracks container dimensions. Removed Node List table and placeholder card from Sprint 1. Page uses `overflow-hidden` for canvas scroll isolation.
  - Verification: Summary cards toggle open/closed, graph canvas fills remaining space

- [x] **T2.2**: Implement custom node rendering via `nodeCanvasObject` callback -- draw circles colored by `GRAPH_NODE_HEX_COLORS[node.fileType]`, render labels below nodes, size nodes by edge count (more connections = larger node)
  - Files: `components/graph/graph-canvas.tsx`
  - Evidence: `nodeCanvasObject` draws colored circles using `GRAPH_NODE_HEX_COLORS`, labels below nodes with zoom-responsive font size, node radius formula `Math.max(4, Math.min(12, 4 + edgeCount))`. `nodeCanvasObjectMode` returns `"replace"` for full custom rendering. `nodePointerAreaPaint` provides hit detection with 4px padding.
  - Verification: Nodes display with correct colors per type, labels readable at default zoom

- [x] **T2.3**: Implement edge rendering via `linkColor` and `linkWidth` callbacks -- color edges by type, use dashed lines for `tag-similarity` and `structural` edge types via `linkLineDash`
  - Files: `components/graph/graph-canvas.tsx`
  - Evidence: Created `EDGE_HEX_COLORS` (light/dark per type), `EDGE_DASH` (null for solid, arrays for dashed), `EDGE_WIDTH` (1.2 for wiki-link down to 0.5 for structural). `linkColor`, `linkWidth`, `linkLineDash` callbacks read edge type and return appropriate values. `frontmatter-ref` uses `[6,3]`, `tag-similarity` uses `[3,3]`, `structural` uses `[2,4]`.
  - Verification: Edges display with distinct styles per type

- [x] **T2.4**: Implement dark mode support -- detect `.dark` class on document and adjust node label colors, background color, and edge opacity accordingly
  - Files: `components/graph/graph-canvas.tsx`
  - Evidence: `useIsDarkMode()` hook watches `document.documentElement.classList` via MutationObserver. Background: `#ffffff` (light) / `#0a0a0a` (dark). Labels: `rgba(31,41,55,alpha)` (light) / `rgba(229,231,235,alpha)` (dark). Edge colors have separate light/dark hex values. Tooltip background adapts to theme.
  - Verification: Graph renders correctly in both light and dark themes

### Phase 3 -- Interaction Layer

**Objective**: Add click-to-navigate, hover tooltips with node details, hover highlight of connected nodes/edges, and node dragging.

**Tasks**:

- [x] **T3.1**: Implement click-to-navigate via `onNodeClick` callback -- map node `fileType` + `filePath` to Kyro routes and call `router.push()`
  - Files: `components/graph/graph-canvas.tsx`
  - Evidence: `handleNodeClick` maps `fileType` to routes: `readme` -> `/readme`, `roadmap` -> `/roadmap`, `finding` -> `/findings`, `sprint` -> `/sprints/{slug}` (extracts slug from filePath), `document` -> `/documents`. Uses `useRouter()` from `next/navigation` and `activeProjectId` from store.
  - Verification: Route mapping covers all 5 node types

- [x] **T3.2**: Implement hover tooltip via canvas drawing on `onNodeHover` -- show file name, type, tag count, and edge count in a floating panel near the node
  - Files: `components/graph/graph-canvas.tsx`
  - Evidence: Tooltip drawn directly on canvas via `nodeCanvasObject` when `isHovered` is true. Shows node label (bold), type, connection count, and up to 3 tags. Background uses `roundRect` with theme-aware colors. Only renders when `globalScale > 0.3` to avoid cluttering at extreme zoom-out.
  - Verification: Hovering a node shows tooltip with correct metadata

- [x] **T3.3**: Implement connected-node highlighting on hover -- when hovering a node, dim all non-connected nodes/edges and highlight the hovered node and its direct neighbors
  - Files: `components/graph/graph-canvas.tsx`
  - Evidence: `adjacencyMap` (useMemo) precomputes bidirectional neighbor sets from edges. `isHighlighted()` checks if node is hovered or neighbor. Non-highlighted nodes render at 0.15 alpha with `"26"` hex suffix on fill color. `linkColor` callback dims non-connected edges to `#eeeeee` (light) / `#333333` (dark). Hovered node gets a white/black border stroke.
  - Verification: Hovering a node visually highlights its connections and dims the rest

- [x] **T3.4**: Implement node dragging with pinning and "Unpin All" action
  - Files: `components/graph/graph-canvas.tsx`
  - Evidence: `enableNodeDrag={true}` on ForceGraph2D. `handleNodeDragEnd` sets `node.fx = node.x; node.fy = node.y` to pin. `unpinAll()` exposed via `useImperativeHandle` iterates all nodes setting `fx/fy = undefined` and calls `d3ReheatSimulation()`.
  - Verification: Nodes can be dragged, stay pinned after drag, "Unpin All" releases them

### Phase 4 -- Controls & Layout

**Objective**: Add zoom controls, reset view button, a legend panel, responsive sizing, and a manual refresh button.

**Tasks**:

- [x] **T4.1**: Create `components/graph/graph-controls.tsx` -- floating control panel with zoom in, zoom out, reset view, and unpin all buttons
  - Files: `components/graph/graph-controls.tsx`
  - Evidence: Floating panel positioned `absolute bottom-4 right-4` with `bg-background/90 backdrop-blur-sm`. Uses `ZoomIn`, `ZoomOut`, `Maximize2`, `PinOff` Lucide icons in `Button` components with `Tooltip` wrappers. Actions call parent via props which forward to `GraphCanvasHandle` ref methods.
  - Verification: All buttons work, zoom controls adjust canvas zoom level

- [x] **T4.2**: Create `components/graph/graph-legend.tsx` -- small legend panel showing node type colors and edge type styles
  - Files: `components/graph/graph-legend.tsx`
  - Evidence: Positioned `absolute top-4 right-4`. Collapsible via toggle button. Shows 5 node types with colored circles from `GRAPH_NODE_HEX_COLORS` and 5 edge types with SVG line samples using `strokeDasharray` from `GRAPH_EDGE_STYLES`. Labels mapped via `NODE_TYPE_LABELS` record.
  - Verification: Legend shows all node types with correct colors and edge types with correct styles

- [x] **T4.3**: Implement responsive canvas sizing via ResizeObserver
  - Files: `components/pages/graph-view-page.tsx`
  - Evidence: `containerRef` on the graph container div. `ResizeObserver` in useEffect tracks content rect changes with 100ms debounce. Initial measurement via `getBoundingClientRect()`. Dimensions passed as `width`/`height` props to `GraphCanvas`.
  - Verification: Graph canvas resizes when the browser window or sidebar changes size

- [x] **T4.4**: Add "Refresh Graph" button to the graph controls
  - Files: `components/graph/graph-controls.tsx`, `components/pages/graph-view-page.tsx`
  - Evidence: `RefreshCw` icon with `animate-spin` class when `isRefreshing` is true. Button disabled during loading. `handleRefresh` callback calls `loadGraph(activeProjectId)` from store.
  - Verification: Clicking refresh re-fetches graph data and updates the visualization

- [x] **T4.5**: Update `components/graph/index.ts` barrel export with all new components
  - Files: `components/graph/index.ts`
  - Evidence: Exports `GraphCanvas`, `GraphCanvasHandle` (type), `GraphControls`, `GraphLegend`.
  - Verification: All components exportable from `@/components/graph`

---

## Emergent Phases

### Emergent Phase E1 -- TypeScript Generic Erasure Fix

**Objective**: Fix TypeScript errors caused by `next/dynamic` erasing the generic type parameters of `ForceGraph2D`, making all callback signatures incompatible with our custom datum types.

**Tasks**:

- [x] **TE1.1**: Refactor all ForceGraph2D callbacks to accept base `NodeObject`/`LinkObject` types and cast to `GraphNodeDatum`/`GraphLinkDatum` internally
  - Files: `components/graph/graph-canvas.tsx`
  - Evidence: 8 callbacks (nodeCanvasObject, nodePointerAreaPaint, onNodeClick, onNodeHover, onNodeDragEnd, linkColor, linkWidth, linkLineDash) all changed from `(node: GraphNodeDatum, ...)` to `(rawNode: NodeObject, ...) => { const node = rawNode as unknown as GraphNodeDatum; ... }`. This is the standard pattern for react-force-graph-2d with dynamic imports.
  - Verification: 0 new TypeScript errors (4 pre-existing only)

---

## Findings Consolidation

| # | Finding | Origin Phase | Impact | Action Taken |
|---|---------|-------------|--------|-------------|
| 1 | `next/dynamic` with `ssr: false` erases generic type parameters from `ForceGraph2D`, causing all typed callbacks to fail TypeScript checking | Phase 1 | medium | Added Emergent Phase E1: all callbacks accept base `NodeObject`/`LinkObject` and cast internally |
| 2 | No shadcn/ui Collapsible component available (only 18 components installed); used simple boolean state toggle instead | Phase 2 | low | Used `useState(false)` with conditional rendering -- simpler and avoids adding a dependency |
| 3 | Canvas `roundRect` API used for tooltips -- available in modern browsers but not in Node.js Canvas polyfills | Phase 3 | low | Acceptable for browser-only rendering (component is `ssr: false`); would need fallback for server-side rendering |
| 4 | react-force-graph-2d mutates node objects in-place (adding `x`, `y`, `vx`, `vy`), so `GraphNodeDatum` needs mutable `fx`/`fy` fields for pinning | Phase 3 | low | Added `fx?: number | undefined` and `fy?: number | undefined` to `GraphNodeDatum` interface |

---

## Accumulated Technical Debt

| # | Item | Origin | Sprint Target | Status | Resolved In |
|---|------|--------|--------------|--------|-------------|
| D1 | Structural edge explosion for large directories (>10 files) currently silently skipped | Sprint 1 Phase 4 | Sprint 3 | open | -- |
| D2 | Graph builder lacks unit tests (relies on integration via initIndex) | Sprint 1 Phase 4 | Sprint 4 | open | -- |
| D3 | Tag-similarity threshold hardcoded at 2 shared tags; should be configurable | Sprint 1 Phase 4 | Sprint 3 | open | -- |
| D4 | API route clusters are type-based only; directory-based and tag-based clusters not yet implemented | Sprint 1 Phase 5 | Sprint 3 | open | -- |
| D5 | Graph canvas has no unit tests (Canvas 2D mocking required) | Sprint 2 Phase 2 | Sprint 4 | open | -- |
| D6 | Tooltip rendered directly on canvas; React overlay with shadcn components would be more polished but adds complexity | Sprint 2 Phase 3 | Sprint 4 | open | -- |

---

## Definition of Done

- [x] All phase tasks completed or explicitly skipped with justification
- [x] All emergent phase tasks completed (1 emergent phase, 1 task)
- [x] Accumulated debt table updated (2 new items: D5, D6)
- [x] Retro section filled
- [x] Recommendations for next sprint documented
- [x] Re-entry prompts updated to reflect current state
- [x] No new TypeScript type errors (4 pre-existing only)
- [x] Lint passes (0 errors, 20 pre-existing warnings)
- [x] All existing tests still pass (311 tests)
- [x] Graph renders interactively with zoom, pan, click, hover
- [x] Nodes colored by type, edges styled by type
- [x] Click-to-navigate works for all node types
- [x] Dark mode renders correctly

---

## Retro

### What Went Well

- The `react-force-graph-2d` library is exceptionally well-designed for this use case. It handles force simulation, zoom/pan, and Canvas 2D rendering out of the box, leaving us to focus on the domain-specific rendering logic (colors, styles, interactions).
- The `forwardRef` + `useImperativeHandle` pattern cleanly separates canvas control methods (zoom, unpin) from the rendering component, making the controls panel trivial to implement.
- All 16 tasks fit naturally into the planned 4 phases with no scope changes. One emergent phase (E1) was needed for a TypeScript issue but it was a mechanical fix.
- The `GRAPH_NODE_HEX_COLORS` and `GRAPH_EDGE_STYLES` constants from Sprint 1 integrated seamlessly -- no color mapping work needed.

### What Didn't Go Well

- The `next/dynamic` import erasing generic types was not anticipated in the sprint plan. All 8 callbacks needed refactoring from typed datum parameters to base types with internal casts. This is a known issue with Next.js dynamic imports but should have been flagged as a risk.
- Canvas-based tooltip rendering is functional but less polished than React overlay tooltips. The `roundRect` API, font sizing at different zoom levels, and positioning relative to the node all required manual calibration.

### Surprises / Unexpected Findings

- `react-force-graph-2d` mutates node objects in-place during simulation (adding `x`, `y`, `vx`, `vy`). This means the `graphInput` useMemo returns mutable objects that the library modifies -- which is expected behavior but conflicts with React's immutability expectations. Pinning via `fx`/`fy` works because of this mutation.
- The library's `onEngineStop` fires when the force simulation stabilizes, which is the ideal moment to call `zoomToFit()` for initial centering. This avoids the common problem of the graph flying off-screen on first load.
- Edge `source` and `target` fields change from string IDs to full node objects after the force simulation runs. The `linkColor` callback needed to handle both formats (`typeof link.source === "object" ? link.source.id : link.source`).

### New Technical Debt Detected

- D5: Graph canvas has no unit tests (Canvas 2D mocking would be complex)
- D6: Canvas tooltip could be replaced with React overlay using shadcn components for better styling

---

## Recommendations for Sprint 3

1. Add type/tag filter panel to the graph page -- toggle node types on/off, filter by tags. This directly addresses the Sprint 3 roadmap focus (filtering).
2. Implement visual clustering -- draw convex hulls or background regions around node clusters. Use the existing `GraphCluster` data from the API.
3. Integrate with `useRealtimeSync` hook to auto-refresh graph data when files change via SSE. This removes the need for the manual Refresh button.
4. Add a minimap component for navigation in large graphs (react-force-graph-2d does not include one natively; would need a custom Canvas minimap or a scaled-down clone).
5. Consider switching canvas tooltips to React overlay divs positioned via `graph2ScreenCoords()` for richer formatting and accessibility (addresses D6).
