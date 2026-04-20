---
title: "Finding: Graph Builder & Incremental Updates"
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

# Finding: Graph Builder & Incremental Updates

## Summary

A graph builder module is needed to orchestrate the parsing of all project files, resolve cross-file references, and produce the complete graph data. It must support both full rebuilds and incremental updates triggered by the file-watcher.

## Severity / Impact

high -- This is the glue between parsing and storage. It must handle reference resolution (matching wiki-link names to actual files) and rebuild performance for large projects.

## Details

### Build Pipeline

1. Scan all markdown files in a project (sprints/, findings/, documents/, README.md, ROADMAP.md)
2. For each file: extract content, frontmatter, and all references using graph-parser
3. Create a GraphNode for each file
4. Resolve references to target nodes (name matching, path resolution)
5. Create GraphEdge for each resolved reference
6. Compute tag-similarity edges (files sharing 2+ tags get a weak edge)
7. Create structural edges (files in same directory)
8. Write all nodes and edges to SQLite

### Incremental Update Strategy

When a file changes (detected by file-watcher):
1. Remove all edges where this file is source
2. Re-parse the file
3. Update the node (or create if new)
4. Re-extract references and create new edges
5. Tag-similarity edges need recalculation only if tags changed

### Reference Resolution

The tricky part is mapping `[[SPRINT-01]]` to the actual file `sprints/SPRINT-01-architecture.md`. Strategy:
- Build a name-to-path index from all known files
- Match wiki-links by filename prefix (case-insensitive, without extension)
- For ambiguous matches (multiple files with same prefix), prefer exact match
- Unresolved links create "dangling" edges (target = null) for UI indication

### Performance Considerations

For a project with 20 sprints, 15 findings, 10 documents:
- ~50 files to parse
- ~200 edges estimated (links + tags + structural)
- Full rebuild should be <500ms
- Incremental update should be <50ms per file

## Affected Files

- `lib/index/graph-builder.ts` (new) -- Graph building orchestration
- `lib/index/builder.ts` -- Call graph builder after file indexing
- `lib/file-format/graph-parser.ts` -- Used by graph builder for reference extraction

## Recommendations

1. Create `lib/index/graph-builder.ts` with `buildProjectGraph()` and `rebuildFileGraph()`
2. Use a Map<string, GraphNode> for fast name-to-node resolution during building
3. Integrate into existing `initIndex()` flow (call after all files are indexed)
4. Hook into `reindexFile()` for incremental graph updates
5. Add a `buildGraphForProject(projectId)` function for on-demand rebuild
