---
title: "Sprint 1 -- Foundation: Data Model, Parsing, Storage, Builder, API & Route"
date: "2026-03-10"
updated: "2026-03-10"
project: "kyro-graph-view"
type: "sprint-plan"
status: "completed"
version: "1.1"
sprint: 1
progress: 100
next_doc: "[[SPRINT-02-interactive-ui]]"
parent_doc: "[[ROADMAP]]"
agents:
  - "claude-opus-4-6"
tags:
  - "kyro-graph-view"
  - "sprint-plan"
  - "sprint-1"
changelog:
  - version: "1.0"
    date: "2026-03-10"
    changes: ["Sprint generated"]
  - version: "1.1"
    date: "2026-03-10"
    changes: ["Sprint completed — all 20 tasks done"]
related:
  - "[[ROADMAP]]"
  - "[[01-graph-data-model]]"
  - "[[02-markdown-link-parsing]]"
  - "[[03-sqlite-graph-storage]]"
  - "[[04-graph-builder]]"
  - "[[06-api-route-and-service]]"
  - "[[07-route-nav-integration]]"
---

# Sprint 1 -- Foundation: Data Model, Parsing, Storage, Builder, API & Route

> Source: `findings/01-graph-data-model.md`, `findings/02-markdown-link-parsing.md`, `findings/03-sqlite-graph-storage.md`, `findings/04-graph-builder.md`, `findings/06-api-route-and-service.md`, `findings/07-route-nav-integration.md`
> Previous Sprint: None
> Version Target: 4.0.0
> Type: feature
> Carry-over: 0 items from previous sprint
> Execution Date: 2026-03-10
> Executed By: claude-opus-4-6

---

## Sprint Objective

Build the complete backend pipeline for the graph view feature: define the graph data model (Zod schemas for nodes, edges, clusters), create markdown link/reference parsers, extend the SQLite index with graph tables, implement the graph builder that orchestrates parsing and reference resolution, expose graph data via an API route, and scaffold the page route at `/(workspace)/[projectId]/graph` with a placeholder UI. By the end of this sprint, graph data is automatically derived from project files and accessible via API.

---

## Disposition of Previous Sprint Recommendations

N/A -- This is Sprint 1 (no previous sprint).

---

## Phases

### Phase 1 -- Graph Data Model

**Objective**: Define Zod schemas for GraphNode, GraphEdge, GraphCluster, and GraphData in `lib/types.ts`. Add graph-related UI constants (node type colors, edge type styles) to `lib/config.ts`.

**Tasks**:

- [x] **T1.1**: Add Zod schemas for `GraphNodeSchema`, `GraphEdgeSchema`, `GraphClusterSchema`, `GraphDataSchema` and their inferred TypeScript types to `lib/types.ts`
  - Files: `lib/types.ts`
  - Evidence: Added 6 Zod schemas (GraphNodeTypeSchema, GraphEdgeTypeSchema, GraphNodeSchema, GraphEdgeSchema, GraphClusterSchema, GraphDataSchema) and 6 inferred TS types. All compile cleanly.
  - Verification: `pnpm tsc --noEmit` passes (4 pre-existing errors only, none from graph types)

- [x] **T1.2**: Add `GraphEdgeTypeSchema` enum (`wiki-link`, `markdown-link`, `frontmatter-ref`, `tag-similarity`, `structural`) and `GraphNodeTypeSchema` enum (`sprint`, `finding`, `document`, `readme`, `roadmap`) to `lib/types.ts`
  - Files: `lib/types.ts`
  - Evidence: Both enums defined as z.enum() with all specified values. Types exported as GraphNodeType, GraphEdgeType.
  - Verification: Types importable from `@/lib/types`

- [x] **T1.3**: Add graph UI constants to `lib/config.ts`: `GRAPH_NODE_COLORS` (color per node type), `GRAPH_EDGE_STYLES` (style per edge type), `Graph` nav item with `Network` icon
  - Files: `lib/config.ts`
  - Evidence: Added GRAPH_NODE_COLORS (Record<GraphNodeType, string>), GRAPH_NODE_HEX_COLORS (hex for graph rendering), GRAPH_EDGE_STYLES (Record<GraphEdgeType, {color, dashArray, label}>). Nav item added between Documents and Re-entry Prompts with Network icon.
  - Verification: Constants importable, nav item in NAV_ITEMS array

### Phase 2 -- Markdown Link Parser

**Objective**: Create `lib/file-format/graph-parser.ts` with pure functions to extract all cross-file references from markdown content: wiki-links, standard markdown links, frontmatter `related` fields, tags, and sprint-forge structural references.

**Tasks**:

- [x] **T2.1**: Implement `extractWikiLinks(content: string): string[]` -- extracts all `[[target]]` patterns from markdown body and frontmatter
  - Files: `lib/file-format/graph-parser.ts`
  - Evidence: Regex-based extraction with deduplication via Set. 8 unit tests covering single, multiple, deduplicated, frontmatter, empty, and edge cases.
  - Verification: 8/8 tests pass

- [x] **T2.2**: Implement `extractMarkdownLinks(content: string): Array<{ text: string; href: string }>` -- extracts all `[text](href)` patterns, filtering out external URLs (http/https)
  - Files: `lib/file-format/graph-parser.ts`
  - Evidence: Negative lookbehind for image links, EXTERNAL_URL_RE filter for http/https/mailto/ftp, anchor-only exclusion. Frontmatter stripped before scanning body.
  - Verification: 8/8 tests pass

- [x] **T2.3**: Implement `extractFrontmatterRefs(content: string): string[]` -- uses gray-matter to extract `related`, `previous_doc`, `next_doc`, `parent_doc` fields, resolves wiki-link syntax
  - Files: `lib/file-format/graph-parser.ts`
  - Evidence: Handles related array + 4 single-value fields (previous_doc, next_doc, parent_doc, source). Resolves [[wiki-link]] syntax. Deduplicates.
  - Verification: 6/6 tests pass

- [x] **T2.4**: Implement `extractTags(content: string): string[]` -- extracts frontmatter `tags` array
  - Files: `lib/file-format/graph-parser.ts`
  - Evidence: Handles YAML array and inline array formats. Filters empty/whitespace strings.
  - Verification: 5/5 tests pass

- [x] **T2.5**: Implement `extractFileReferences(content: string, filePath: string): FileReferences` -- unified function that calls all extractors and returns a structured result with all reference types
  - Files: `lib/file-format/graph-parser.ts`
  - Evidence: Calls all 4 extractors, returns FileReferences struct. Integration test with sprint-forge format.
  - Verification: 3/3 tests pass

- [x] **T2.6**: Write comprehensive unit tests for graph-parser
  - Files: `lib/file-format/__tests__/graph-parser.test.ts`
  - Evidence: 30 unit tests across 5 describe blocks. Edge cases: empty content, no frontmatter, deduplication, image exclusion, anchor exclusion, whitespace tags.
  - Verification: 30/30 tests pass

### Phase 3 -- SQLite Graph Storage

**Objective**: Extend the SQLite schema with `graph_nodes` and `graph_edges` tables, add indexes, and create typed query functions for graph data retrieval.

**Tasks**:

- [x] **T3.1**: Add `graph_nodes` and `graph_edges` table definitions to `createSchema()` in `lib/index/sqlite.ts`, including indexes on `project_id`, `source_id`, `target_id`, `edge_type`, `file_type`
  - Files: `lib/index/sqlite.ts`
  - Evidence: Two new tables (graph_nodes with FK to projects, graph_edges with no FK for flexibility). 6 new indexes for graph queries.
  - Verification: Schema compiles, tables created in createSchema()

- [x] **T3.2**: Add graph query functions to `lib/index/queries.ts`: `queryGraphData(projectId)`, `queryGraphNodes(projectId, filters?)`, `queryGraphEdges(projectId, filters?)`, `queryNodeNeighbors(nodeId, projectId)`
  - Files: `lib/index/queries.ts`
  - Evidence: 4 query functions with typed row interfaces, row-to-domain mappers, optional filters by fileType/edgeType. queryNodeNeighbors uses UNION query for bidirectional edge lookup.
  - Verification: Functions handle null db gracefully (return empty arrays)

### Phase 4 -- Graph Builder

**Objective**: Create `lib/index/graph-builder.ts` that orchestrates the full graph build pipeline: scans project files, extracts references, resolves targets, and writes nodes/edges to SQLite. Integrate with existing `initIndex()` and `reindexFile()` flows.

**Tasks**:

- [x] **T4.1**: Implement `buildProjectGraph(projectId, projectPath)` in `lib/index/graph-builder.ts` -- scans all markdown files, creates nodes, extracts references, resolves targets to node IDs, creates edges, writes to SQLite
  - Files: `lib/index/graph-builder.ts`
  - Evidence: 8-step pipeline: discover files, create nodes, build name index, extract references, resolve wiki-links/md-links/frontmatter-refs, build tag-similarity edges (2+ shared tags), build structural edges (same directory), deduplicate, write to SQLite.
  - Verification: TypeScript compiles cleanly

- [x] **T4.2**: Implement `rebuildFileGraph(filePath, projectId)` -- incremental update: removes old edges for file, re-parses, re-resolves, writes new edges
  - Files: `lib/index/graph-builder.ts`
  - Evidence: Handles both file change (upsert node, rebuild source edges) and file deletion (remove node + all associated edges). Uses timestamp-based edge IDs for incremental uniqueness.
  - Verification: TypeScript compiles cleanly

- [x] **T4.3**: Implement reference resolution: `resolveReference(ref, knownFiles)` -- maps wiki-link names and relative paths to actual file node IDs using a name-to-path index
  - Files: `lib/index/graph-builder.ts`
  - Evidence: Exported function with 3-level resolution: exact match, without-extension match, prefix match (e.g., "SPRINT-01" matches "sprint-01-architecture"). Also resolveRelativePath and resolvePathReference for markdown links.
  - Verification: Function exported for testing

- [x] **T4.4**: Integrate `buildProjectGraph()` into `initIndex()` in `lib/index/builder.ts` -- call after all files are indexed
  - Files: `lib/index/builder.ts`
  - Evidence: Added loop after document indexing that calls buildProjectGraph() for each project with try/catch. Graph node/edge counts logged alongside existing metrics.
  - Verification: TypeScript compiles, graph tables populated during initIndex()

- [x] **T4.5**: Integrate `rebuildFileGraph()` into `reindexFile()` in `lib/index/builder.ts` -- call after file data is updated
  - Files: `lib/index/builder.ts`
  - Evidence: Added rebuildFileGraph() call after checksum update in reindexFile(). Also added to file-deletion path with best-effort error handling.
  - Verification: TypeScript compiles, file-watcher triggers graph updates

### Phase 5 -- API Route, Service & Page Scaffold

**Objective**: Create the API route to serve graph data, extend the service layer, add the page route and nav item, and create a minimal placeholder page component.

**Tasks**:

- [x] **T5.1**: Create API route `app/api/projects/[projectId]/graph/route.ts` -- GET handler that queries graph data from SQLite and returns `{ data: GraphData }`
  - Files: `app/api/projects/[projectId]/graph/route.ts`
  - Evidence: GET handler queries queryGraphData(), builds type-based clusters, returns full GraphData with metadata. Follows existing route pattern (ok/handleError).
  - Verification: Route compiles, follows project API convention

- [x] **T5.2**: Add `getGraph(projectId: string): Promise<GraphData>` to `ProjectsService` interface and implement in file service (calls API route)
  - Files: `lib/services/types.ts`, `lib/services/file/projects.file.ts`
  - Evidence: Added getGraph() to ProjectsService interface. FileProjectsService calls /api/projects/{id}/graph via localFetch.
  - Verification: Interface and implementation compile cleanly

- [x] **T5.3**: Implement mock graph data generator and mock service method
  - Files: `lib/services/mock/projects.mock.ts`
  - Evidence: MockProjectsService.getGraph() generates nodes from README, ROADMAP, and project sprints. Creates wiki-link and frontmatter-ref edges. Returns typed GraphData with clusters.
  - Verification: TypeScript compiles (fixed array type narrowing issue by explicitly typing as GraphNode[]/GraphEdge[])

- [x] **T5.4**: Add `graphData`, `graphLoading`, `loadGraph()` state slice to Zustand store
  - Files: `lib/store.ts`
  - Evidence: Added graphData (Record<string, GraphData>), graphLoading (Record<string, boolean>), loadGraph() following the same pattern as findings/roadmap/reentryPrompts lazy loading.
  - Verification: Store compiles cleanly

- [x] **T5.5**: Create `app/(workspace)/[projectId]/graph/page.tsx` route and `components/pages/graph-view-page.tsx` placeholder page component
  - Files: `app/(workspace)/[projectId]/graph/page.tsx`, `components/pages/graph-view-page.tsx`
  - Evidence: Page component shows: loading skeleton, empty state, summary cards (nodes by type, edges by type, clusters), node list with type badges and tags, placeholder card for Sprint 2 interactive graph. Uses GRAPH_NODE_COLORS from config.ts.
  - Verification: Route renders, TypeScript compiles

---

## Emergent Phases

<!-- This section starts EMPTY. Populated during execution when new work is discovered. -->

---

## Findings Consolidation

<!-- Filled during sprint CLOSE. -->

| # | Finding | Origin Phase | Impact | Action Taken |
|---|---------|-------------|--------|-------------|
| 1 | TypeScript array literal narrowing causes type errors in mock service when mixing node/edge types | Phase 5 | low | Fixed by explicitly typing arrays as GraphNode[] and GraphEdge[] |
| 2 | Structural edges create O(n^2) edges in directories with many files; capped at 10 files per directory | Phase 4 | medium | Added cap of 10 files per directory to avoid graph clutter; larger directories skip structural edges |
| 3 | Frontmatter refs and wiki-links can create duplicate edges for the same source-target pair | Phase 4 | low | Added deduplication in buildProjectGraph() that skips frontmatter-ref edges when a wiki-link edge already exists for the same pair |
| 4 | User prefers react-force-graph-2d over d3-force for Sprint 2 graph rendering | Phase 5 | high | Updated Sprint 2 plan direction: will use react-force-graph-2d instead of custom d3-force + React SVG |

---

## Accumulated Technical Debt

| # | Item | Origin | Sprint Target | Status | Resolved In |
|---|------|--------|--------------|--------|-------------|
| D1 | Structural edge explosion for large directories (>10 files) currently silently skipped | Sprint 1 Phase 4 | Sprint 3 | open | -- |
| D2 | Graph builder lacks unit tests (relies on integration via initIndex) | Sprint 1 Phase 4 | Sprint 4 | open | -- |
| D3 | Tag-similarity threshold hardcoded at 2 shared tags; should be configurable | Sprint 1 Phase 4 | Sprint 3 | open | -- |
| D4 | API route clusters are type-based only; directory-based and tag-based clusters not yet implemented | Sprint 1 Phase 5 | Sprint 3 | open | -- |

---

## Definition of Done

- [x] All phase tasks completed or explicitly skipped with justification
- [x] All emergent phase tasks completed (no emergent phases)
- [x] Accumulated debt table updated (4 new items added)
- [x] Retro section filled
- [x] Recommendations for next sprint documented
- [x] Re-entry prompts updated to reflect current state
- [x] No TypeScript type errors (`pnpm tsc --noEmit`) -- 4 pre-existing errors only
- [x] Lint passes (`pnpm lint`) -- 0 errors, 20 pre-existing warnings
- [x] All existing tests still pass (`pnpm test`) -- 311 tests pass (was 281, +30 new)
- [x] New graph-parser unit tests pass -- 30/30
- [x] Graph data accessible via API route

---

## Retro

<!-- Filled when the sprint is CLOSED. Do not fill during generation. -->

### What Went Well

- Clean integration with existing codebase architecture. The SQLite index, file-watcher, service layer, and store patterns are well-established and extending them was straightforward.
- The graph-parser achieved 30 unit tests with comprehensive edge case coverage on the first pass, no debugging needed.
- TypeScript caught a type narrowing issue in the mock service early, preventing a runtime bug.
- No emergent phases required -- the analysis was thorough enough to anticipate all Phase 1 needs.

### What Didn't Go Well

- The graph-builder module is complex (~350 lines) and currently lacks its own unit tests. It's only tested indirectly through integration with initIndex().
- Structural edges have a quadratic growth problem for large directories that required an arbitrary cap at 10 files.

### Surprises / Unexpected Findings

- The user prefers `react-force-graph-2d` over the initially planned `d3-force + React SVG` approach for Sprint 2. This simplifies the rendering work significantly -- react-force-graph-2d handles zoom, pan, and force simulation out of the box.
- The existing API route pattern uses `[projectId]` (not `[id]`) as the dynamic segment -- the sprint plan originally specified `[id]` which would have been incorrect.
- Frontmatter wiki-link references (`related: ["[[ROADMAP]]"]`) overlap with body wiki-links, requiring explicit deduplication logic.

### New Technical Debt Detected

- D1: Structural edge cap at 10 files per directory is a blunt instrument
- D2: Graph builder lacks unit tests
- D3: Tag-similarity threshold hardcoded
- D4: Only type-based clusters implemented

---

## Recommendations for Sprint 2

<!-- Filled when the sprint is CLOSED. Each recommendation becomes a candidate task for the next sprint. -->

1. Use `react-force-graph-2d` library for the interactive graph rendering in Sprint 2. Install it as a dependency and build the graph canvas component around it. This replaces the originally planned custom d3-force + React SVG approach.
2. Add unit tests for `graph-builder.ts` (buildProjectGraph, rebuildFileGraph, resolveReference) before building the interactive UI. This addresses D2 and prevents regressions when the builder is modified for performance optimization.
3. The page component currently shows a data summary and placeholder. Sprint 2 should replace the placeholder card with the actual react-force-graph-2d canvas while keeping the summary cards as a collapsible sidebar or header.
4. Consider adding a "Refresh Graph" button on the graph page that triggers `loadGraph()` manually, since SSE-based auto-refresh is planned for Sprint 3.
5. The `GRAPH_NODE_HEX_COLORS` map in config.ts should be consumed by react-force-graph-2d's `nodeColor` prop in Sprint 2 to maintain consistent coloring with the badge colors.
