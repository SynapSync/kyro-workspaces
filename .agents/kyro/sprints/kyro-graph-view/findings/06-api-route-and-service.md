---
title: "Finding: API Route & Service Layer Integration"
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

# Finding: API Route & Service Layer Integration

## Summary

A new API route `/api/projects/[id]/graph` is needed to serve graph data to the client. It should query the SQLite index and return the graph structure. The service layer needs a new method, and mock data is needed for development mode.

## Severity / Impact

medium -- Follows well-established patterns in the codebase. The API route, service interface, and mock implementation are straightforward extensions of existing infrastructure.

## Details

### API Route

Following the existing pattern in `app/api/projects/[id]/`:

```typescript
// GET /api/projects/[id]/graph
// Returns: { data: { nodes: GraphNode[], edges: GraphEdge[], clusters: GraphCluster[] } }
// Query params: ?types=sprint,finding&tags=architecture (optional filters)
```

### Service Layer

`lib/services/types.ts` defines `ProjectsService` interface. Add:
```typescript
getGraph(projectId: string, filters?: GraphFilters): Promise<GraphData>;
```

Implementations:
- `lib/services/file/` -- Queries SQLite index via `lib/index/queries.ts`
- `lib/services/mock/` -- Returns static mock graph data

### Store Integration

`lib/store.ts` needs a new slice for graph data:
```typescript
// Per-project graph data, loaded on demand
graphData: Record<string, GraphData>;
graphLoading: Record<string, boolean>;
loadGraph: (projectId: string) => Promise<void>;
```

Follows the exact same pattern as `findings`, `roadmaps`, and `reentryPrompts`.

### Real-time Updates

The existing SSE system (`/api/events`) already pushes file change notifications. The graph page can use the `useRealtimeSync` hook to trigger graph reload when files change.

## Affected Files

- `app/api/projects/[id]/graph/route.ts` (new) -- API route
- `lib/services/types.ts` -- Add getGraph to ProjectsService
- `lib/services/file/projects.file.ts` -- File service implementation
- `lib/services/mock/projects.mock.ts` -- Mock implementation
- `lib/store.ts` -- Add graph state slice

## Recommendations

1. Follow existing API route pattern: `getWorkspacePath()` + `resolveAndGuard()` + `handleError()`
2. Add `getGraph()` to the ProjectsService interface
3. Create mock graph data generator for development mode
4. Use lazy loading pattern (same as findings/roadmap)
5. Leverage existing `useRealtimeSync` hook for live updates
