---
title: "Finding: SQLite Graph Storage & Queries"
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

# Finding: SQLite Graph Storage & Queries

## Summary

The graph data (nodes and edges) should be stored in the existing SQLite index for fast queries, incremental updates, and integration with the file-watcher system. New tables and query functions are needed.

## Severity / Impact

high -- The SQLite index is already the backbone for search, project summary, and real-time updates. Extending it for graph data is the natural path, but the schema design must handle edge resolution and incremental rebuilds efficiently.

## Details

### Current SQLite Architecture

- `lib/index/sqlite.ts` -- Singleton database, schema with tables: projects, sprints, tasks, findings, debt_items, documents, file_checksums, plus FTS5 virtual tables
- `lib/index/builder.ts` -- `initIndex()` for full rebuild, `reindexFile()` for incremental, `reindexProject()` for project-level
- `lib/index/queries.ts` -- Typed query wrappers, `searchIndex()` with FTS5
- `lib/index/file-watcher.ts` -- `watchProject()` calls `reindexFile()` on change
- `lib/index/startup.ts` -- `ensureIndex()` initializes at app startup via instrumentation hook

### Proposed Schema Additions

```sql
CREATE TABLE IF NOT EXISTS graph_nodes (
  id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  label TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,  -- 'sprint', 'finding', 'document', 'readme', 'roadmap'
  tags TEXT,                -- JSON array
  metadata TEXT,            -- JSON object (frontmatter fields)
  PRIMARY KEY (id, project_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS graph_edges (
  id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  source_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  edge_type TEXT NOT NULL,  -- 'wiki-link', 'markdown-link', 'frontmatter-ref', 'tag-similarity', 'structural'
  label TEXT,
  weight REAL DEFAULT 1.0,
  PRIMARY KEY (id, project_id)
);
```

### Integration Points

- `initIndex()` should also build graph data after indexing files
- `reindexFile()` should update graph nodes/edges for the changed file
- File deletion should cascade to remove associated graph nodes and edges
- FTS5 is not needed for graph data -- the queries are relational (neighbors, paths)

### Query Requirements

- `getGraphData(projectId)` -- All nodes and edges for a project
- `getNodeNeighbors(nodeId)` -- Direct connections for a node
- `getNodesByType(projectId, fileType)` -- Filter nodes by type
- `getEdgesByType(projectId, edgeType)` -- Filter edges by type

## Affected Files

- `lib/index/sqlite.ts` -- Add graph_nodes and graph_edges tables to schema
- `lib/index/builder.ts` -- Extend initIndex() and reindexFile() for graph data
- `lib/index/queries.ts` -- Add graph query functions
- `lib/index/file-watcher.ts` -- Already handles reindexFile(), no changes needed

## Recommendations

1. Add tables to `createSchema()` in `sqlite.ts`
2. Build graph data in `initIndex()` after existing file parsing
3. Extend `reindexFile()` to rebuild graph data for a changed file
4. Create typed query wrappers in `queries.ts` for graph operations
5. Add indexes on source_id, target_id, edge_type for query performance
