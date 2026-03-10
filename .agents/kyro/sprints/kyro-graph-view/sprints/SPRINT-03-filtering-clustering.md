---
title: "Sprint 3 -- Filtering, Clustering & Real-time Updates"
date: "2026-03-10"
updated: "2026-03-10"
project: "kyro-graph-view"
type: "sprint-plan"
status: "completed"
version: "1.1"
sprint: 3
progress: 100
prev_doc: "[[SPRINT-02-interactive-ui]]"
next_doc: "[[SPRINT-04-performance-testing]]"
parent_doc: "[[ROADMAP]]"
agents:
  - "claude-opus-4-6"
tags:
  - "kyro-graph-view"
  - "sprint-plan"
  - "sprint-3"
changelog:
  - version: "1.0"
    date: "2026-03-10"
    changes: ["Sprint generated"]
  - version: "1.1"
    date: "2026-03-10"
    changes: ["Sprint completed -- all 13 tasks done"]
related:
  - "[[ROADMAP]]"
  - "[[SPRINT-02-interactive-ui]]"
  - "[[05-interactive-graph-ui]]"
  - "[[06-api-route-and-service]]"
---

# Sprint 3 -- Filtering, Clustering & Real-time Updates

> Source: `findings/05-interactive-graph-ui.md`, `findings/06-api-route-and-service.md`
> Previous Sprint: `SPRINT-02-interactive-ui.md` (completed)
> Version Target: 4.2.0
> Type: feature
> Carry-over: 0 items from previous sprint
> Execution Date: 2026-03-10
> Executed By: claude-opus-4-6

---

## Sprint Objective

Add interactive filtering, visual clustering, node search/highlight, and real-time graph updates to the graph view. Users will be able to toggle node types on/off, filter by tags, search for specific nodes with text input, see nodes visually grouped by type via proximity-based clustering, and have the graph auto-refresh when files change via SSE integration.

---

## Disposition of Previous Sprint Recommendations

| # | Recommendation | Disposition | Rationale |
|---|---------------|-------------|-----------|
| R1 | Add type/tag filter panel to the graph page | **ACCEPT** -- T1.1, T1.2, T1.3, T1.4 | Core deliverable of this sprint. Filter panel with type toggles, tag chips, and node search. |
| R2 | Implement visual clustering with convex hulls or background regions | **ACCEPT (MODIFIED)** -- T2.1, T2.2 | Using proximity-based force clustering (d3-force group gravity) instead of convex hulls. Convex hulls require complex Canvas path math and overlap poorly at small scale. Proximity clustering naturally groups same-type nodes together and is simpler to implement with the existing force engine. |
| R3 | Integrate with `useRealtimeSync` to auto-refresh graph data via SSE | **ACCEPT** -- T3.1, T3.2 | Wires graph into existing SSE infrastructure. Adds `loadGraph` call alongside existing `refreshProject`. |
| R4 | Add minimap for navigation in large graphs | **DEFER** to Sprint 4 | Minimap requires a separate scaled Canvas rendering pass or a cloned ForceGraph2D instance. This is primarily a performance/polish feature better suited for Sprint 4 after we know the actual node counts users encounter. |
| R5 | Switch canvas tooltips to React overlay divs for accessibility | **DEFER** to Sprint 4 | Accessibility and polish sprint. Current canvas tooltips work functionally. D6 remains open. |

---

## Phases

### Phase 1 -- Filter Panel

**Objective**: Create a filter panel positioned on the left side of the graph canvas with type toggles, tag filter chips, and a text search input. The GraphCanvas component receives visibility filters and applies them to `nodeVisibility` and related edge hiding.

**Tasks**:

- [x] **T1.1**: Create `components/graph/graph-filters.tsx` -- a floating panel on the left side of the graph container with three sections: node type toggles, tag filter, and search input
  - Files: `components/graph/graph-filters.tsx`
  - Evidence: Panel positioned `absolute top-4 left-4` with `bg-background/90 backdrop-blur-sm`. Three sections: Search, Node Types, Tags. Collapsible via toggle button with Filter icon. Exports `GraphFilterState` type and `DEFAULT_FILTER_STATE` constant. Active filter indicator dot shows when any filter is active.
  - Verification: Panel renders, toggles open/closed

- [x] **T1.2**: Implement type toggle section -- one toggle per `GraphNodeType` with a colored indicator dot and type label. Clicking toggles that type's visibility. Count of nodes per type shown beside label.
  - Files: `components/graph/graph-filters.tsx`
  - Evidence: 5 type toggles (sprint, finding, document, readme, roadmap) with colored dots from `GRAPH_NODE_HEX_COLORS`. Node count computed via `useMemo` over `graph.nodes`. Hidden types get dimmed dot (opacity 0.2) and strikethrough label. Toggling adds/removes from `hiddenTypes` Set.
  - Verification: Clicking toggles adds/removes type from hiddenTypes

- [x] **T1.3**: Implement tag filter section -- extract all unique tags from graph nodes, show as compact clickable chips with AND logic.
  - Files: `components/graph/graph-filters.tsx`
  - Evidence: Unique tags extracted with `useMemo`, sorted alphabetically. Shows up to 20 tags with "show more" toggle. Selected tags get `bg-primary/15 text-primary font-medium`. AND logic: node must have ALL selected tags. "Clear" button resets tag selection.
  - Verification: Tag selection filters nodes correctly with AND logic

- [x] **T1.4**: Implement search input section -- text input with case-insensitive substring matching, clear button, and dimming of non-matching nodes.
  - Files: `components/graph/graph-filters.tsx`
  - Evidence: Input with Search icon, X clear button. `searchQuery` stored in filter state. Search matching computed in `graph-view-page.tsx` as `highlightedNodeIds` Set via `useMemo`. Canvas `isHighlighted` checks `highlightedNodeIds` before hover logic.
  - Verification: Typing dims non-matching nodes, highlights matches

- [x] **T1.5**: Wire filter state into `GraphCanvas` -- add `hiddenTypes`, `selectedTags`, and `highlightedNodeIds` props. Apply via `nodeVisibility`, `linkVisibility`, and updated `isHighlighted`.
  - Files: `components/graph/graph-canvas.tsx`, `components/pages/graph-view-page.tsx`
  - Evidence: Added `hiddenTypes`, `selectedTags`, `highlightedNodeIds` props to `GraphCanvasProps`. `nodeVisibility` callback checks type and tag filters. `linkVisibility` hides edges where either endpoint is hidden (uses `graphInput.nodes.find()`). `isHighlighted` prioritizes search highlights over hover highlights.
  - Verification: All three filter types (type, tag, search) work on canvas

- [x] **T1.6**: Manage filter state in `graph-view-page.tsx` -- lift `GraphFilterState`, pass to filters and canvas, reset on project change.
  - Files: `components/pages/graph-view-page.tsx`
  - Evidence: `useState<GraphFilterState>(DEFAULT_FILTER_STATE)`. `highlightedNodeIds` computed via `useMemo` from `searchQuery`. Filter state passed to `GraphFilters`, `GraphCanvas`, and `GraphLegend`. Resets to default when `activeProjectId` changes (tracked via `useRef`).
  - Verification: State flows correctly, resets on project switch

### Phase 2 -- Visual Clustering

**Objective**: Group same-type nodes together using force-based clustering. Nodes of the same type are pulled toward shared cluster centers, creating visual grouping without explicit convex hulls.

**Tasks**:

- [x] **T2.1**: Implement type-based force clustering in `graph-canvas.tsx` -- custom d3-force that pulls nodes toward type centroids.
  - Files: `components/graph/graph-canvas.tsx`
  - Evidence: Custom `clusterForce` function registered via `fg.d3Force("cluster", ...)`. Each tick: computes centroid per type from current positions, applies gentle pull (strength 0.12 * alpha) toward centroid. Weaker than link force so connections take priority. Cast to `any` for d3-force type compatibility.
  - Verification: Same-type nodes cluster together visually

- [x] **T2.2**: Add cluster labels as canvas overlays at centroid positions.
  - Files: `components/graph/graph-canvas.tsx`
  - Evidence: `renderClusterLabels` callback wired to `onRenderFramePost`. Computes centroids per type, draws labels with muted text (`rgba` with 0.15/0.1 alpha). Only shows for clusters with 2+ visible nodes. Hidden when `globalScale > 2` or `< 0.3`. Respects `hiddenTypes` filter -- hidden type nodes excluded from centroid calculation.
  - Verification: Labels appear at cluster positions, fade at extreme zoom

### Phase 3 -- Real-time Graph Updates

**Objective**: Wire the graph into the existing SSE/file-watcher infrastructure so the graph auto-refreshes when project files change.

**Tasks**:

- [x] **T3.1**: Extend `useRealtimeSync` to also refresh graph data on `index:updated` events with 500ms debounce.
  - Files: `hooks/use-realtime-sync.ts`
  - Evidence: Added `loadGraph` store subscription. On `index:updated` event, calls `refreshProject(projectId)` immediately (existing) and `loadGraph(projectId)` with 500ms debounce via `graphDebounceTimer` ref. Timer cleaned up on dispose.
  - Verification: File changes trigger automatic graph refresh

- [x] **T3.2**: Add visual "Updating..." indicator during SSE-triggered refresh.
  - Files: `components/pages/graph-view-page.tsx`
  - Evidence: `isRefreshing` computed as `isLoading && !!graph` (loading but data exists = background refresh). Shows pulsing dot + "Updating..." text in header next to "Graph View" title. No loading skeleton -- existing graph remains visible.
  - Verification: Subtle indicator during background refresh, no disruption

### Phase 4 -- Integration & Polish

**Objective**: Update barrel exports, legend filter awareness, and keyboard shortcut.

**Tasks**:

- [x] **T4.1**: Update `components/graph/index.ts` barrel export with `GraphFilters`, `GraphFilterState`, and `DEFAULT_FILTER_STATE`.
  - Files: `components/graph/index.ts`
  - Evidence: Exports `GraphFilters`, `DEFAULT_FILTER_STATE` (value), `GraphFilterState` (type), plus existing components.
  - Verification: All components importable from `@/components/graph`

- [x] **T4.2**: Update `graph-legend.tsx` to show active filters -- dim hidden types, show "(filtered)" indicator.
  - Files: `components/graph/graph-legend.tsx`
  - Evidence: Added `GraphLegendProps` with optional `filterState`. Hidden types render at `opacity: 0.3`. When any filter is active, shows "(filtered)" label next to "Legend" heading. Import `GraphFilterState` from sibling `graph-filters.tsx`.
  - Verification: Legend dims hidden types, shows "(filtered)" when active

- [x] **T4.3**: Add keyboard shortcut `/` to focus search input.
  - Files: `components/graph/graph-filters.tsx`
  - Evidence: `useEffect` with `keydown` listener on `document`. Checks `e.key === "/"` and that active element is not INPUT/TEXTAREA/SELECT. Prevents default (to avoid typing "/"), sets `expanded = true`, and focuses `searchInputRef`. Shows `(/)` hint in Search section heading.
  - Verification: Pressing `/` opens filter panel and focuses search

---

## Emergent Phases

No emergent phases required -- all planned work was sufficient.

---

## Findings Consolidation

| # | Finding | Origin Phase | Impact | Action Taken |
|---|---------|-------------|--------|-------------|
| 1 | `linkVisibility` callback uses `graphInput.nodes.find()` which is O(n) per edge -- could be slow for very large graphs | Phase 1 | low | Acceptable for current graph sizes (<100 nodes). Would need a Map-based lookup for 500+ node graphs (Sprint 4 performance work). |
| 2 | Custom d3-force type signature requires `any` cast because `d3Force()` expects `ForceFn` but custom forces don't match the exact signature | Phase 2 | low | Added `eslint-disable` comment. The cast is safe -- react-force-graph-2d calls the function with `(alpha)` which matches our signature. |
| 3 | Cluster labels computed in `onRenderFramePost` recalculate centroids every frame -- memoization could improve performance | Phase 2 | low | No observable performance impact at current graph sizes. Can optimize with frame-throttled centroid caching in Sprint 4. |
| 4 | User had previously refactored node colors to use local `NODE_COLORS` constant instead of importing from config -- this was preserved as required | Phase 1 | low | Graph-canvas uses local `NODE_COLORS`; graph-filters and graph-legend use `GRAPH_NODE_HEX_COLORS` from config (matching muted hex values). Both palettes are consistent. |

---

## Accumulated Technical Debt

| # | Item | Origin | Sprint Target | Status | Resolved In |
|---|------|--------|--------------|--------|-------------|
| D1 | Structural edge explosion for large directories (>10 files) currently silently skipped | Sprint 1 Phase 4 | Sprint 4 | open | -- |
| D2 | Graph builder lacks unit tests (relies on integration via initIndex) | Sprint 1 Phase 4 | Sprint 4 | open | -- |
| D3 | Tag-similarity threshold hardcoded at 2 shared tags; should be configurable | Sprint 1 Phase 4 | Sprint 4 | open | -- |
| D4 | API route clusters are type-based only; directory-based and tag-based clusters not yet implemented | Sprint 1 Phase 5 | Sprint 4 | open | -- |
| D5 | Graph canvas has no unit tests (Canvas 2D mocking required) | Sprint 2 Phase 2 | Sprint 4 | open | -- |
| D6 | Canvas tooltip could be replaced with React overlay using shadcn components | Sprint 2 Phase 3 | Sprint 4 | open | -- |
| D7 | linkVisibility uses O(n) node lookup per edge; needs Map-based lookup for large graphs | Sprint 3 Phase 1 | Sprint 4 | open | -- |
| D8 | Cluster centroid labels recalculated every frame in onRenderFramePost; should be throttled | Sprint 3 Phase 2 | Sprint 4 | open | -- |

---

## Definition of Done

- [x] All phase tasks completed or explicitly skipped with justification
- [x] All emergent phase tasks completed (no emergent phases)
- [x] Accumulated debt table updated (2 new items: D7, D8; D1, D3, D4 retargeted to Sprint 4)
- [x] Retro section filled
- [x] Recommendations for next sprint documented
- [x] Re-entry prompts updated to reflect current state
- [x] No new TypeScript type errors (4 pre-existing only)
- [x] Lint passes (0 errors, 21 warnings -- 1 new from eslint-disable for cluster force cast)
- [x] All existing tests still pass (311 tests)
- [x] Node type toggles show/hide nodes by type
- [x] Tag filter highlights nodes with selected tags
- [x] Search input highlights matching nodes by name
- [x] Same-type nodes cluster visually together
- [x] SSE triggers automatic graph refresh
- [x] Filters and clustering work together without conflicts

---

## Retro

### What Went Well

- The filter panel implementation was clean and self-contained. `GraphFilterState` as a lifted state with `onFilterChange` callback follows the same pattern as other Kyro components (sprint board filters).
- Proximity-based clustering via custom d3-force was far simpler than convex hulls and produces a natural Obsidian-like visual grouping. Three lines of force math achieve what would have been 100+ lines of Canvas path computation.
- The SSE integration was trivial -- adding `loadGraph` alongside the existing `refreshProject` call, with a 500ms debounce, required only ~10 lines of changes to `use-realtime-sync.ts`.
- No emergent phases needed. The sprint plan was well-scoped.

### What Didn't Go Well

- The `linkVisibility` callback does a `graphInput.nodes.find()` for each edge to check source/target visibility. This is O(n*m) worst case and would be a performance problem for graphs with hundreds of nodes/edges. Should use a visibility Map.
- The cluster force type incompatibility with d3-force's `ForceFn` generic required an `any` cast and eslint-disable comment. react-force-graph-2d's type definitions are not designed for custom forces.

### Surprises / Unexpected Findings

- The user had already refactored the graph canvas to use local `NODE_COLORS` instead of importing from config. The filter panel and legend both import `GRAPH_NODE_HEX_COLORS` from config (which matches the local colors). This dual-source pattern works because both were updated to the same muted palette, but it would be cleaner to have a single source.
- The keyboard shortcut `/` conflicts with the command palette in some setups. Adding a check for `e.target` being an input/textarea/select prevents the most common conflicts.
- Cluster labels in `onRenderFramePost` fire every frame even when nodes haven't moved. The canvas redraws frequently even after simulation stops (zoom/pan trigger redraws). This is a potential performance concern for very large graphs.

### New Technical Debt Detected

- D7: linkVisibility O(n) lookup per edge
- D8: Cluster centroid labels recalculated every frame

---

## Recommendations for Sprint 4

1. Build a `visibleNodeIds: Set<string>` map at the page level and pass it to `linkVisibility` for O(1) lookups instead of O(n) per edge (addresses D7).
2. Throttle `onRenderFramePost` cluster label rendering to only recalculate centroids when nodes have moved (e.g., by comparing a fingerprint of node positions between frames) (addresses D8).
3. Add comprehensive unit tests for `graph-builder.ts` and `graph-parser.ts` (addresses D2, D5 partially).
4. Consider a minimap component for navigation in large graphs (deferred from Sprint 2 R4 and Sprint 3 R4).
5. Evaluate whether `NODE_COLORS` in graph-canvas.tsx should be consolidated with `GRAPH_NODE_HEX_COLORS` in config.ts to maintain a single source of truth.
