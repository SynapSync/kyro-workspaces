---
title: "Finding: Graph Data Model & Type System"
date: "2026-03-10"
updated: "2026-03-10"
project: "kyro-graph-view"
type: "analysis"
status: "active"
version: "1.0"
severity: "critical"
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

# Finding: Graph Data Model & Type System

## Summary

Kyro needs a complete graph data model (nodes, edges, clusters) with Zod schemas that integrate into the existing type system in `lib/types.ts`. This is the foundation for everything else -- parsing, storage, rendering, and queries all depend on well-defined graph types.

## Severity / Impact

critical -- Without a solid data model, every downstream component will need refactoring. The type system is the contract between parsing, storage, and rendering layers.

## Details

The existing `lib/types.ts` defines Zod schemas for all domain entities (Task, Sprint, Finding, DebtItem, Document, Project). The graph view needs parallel schemas for:

1. **GraphNode** -- Represents a markdown file. Needs: id, label, filePath, fileType (sprint/finding/document/readme/roadmap), tags, metadata (frontmatter fields), position (for layout persistence).
2. **GraphEdge** -- Represents a relationship between files. Needs: id, source, target, edgeType (wiki-link, standard-link, tag-similarity, structural), label, weight.
3. **GraphCluster** -- Groups of related nodes. Needs: id, label, nodeIds, color, clusterType (directory-based, tag-based, type-based).
4. **GraphData** -- Container: nodes[], edges[], clusters[], metadata (project info, build timestamp).

Key design decisions:
- Node IDs should match existing entity IDs where possible (sprint.id, finding.id, etc.)
- Edge types must distinguish explicit references ([[wiki-links]], markdown links) from implicit relationships (shared tags, same directory)
- Clusters should be derivable from node metadata, not manually maintained
- The model should support incremental updates (add/remove individual nodes/edges)

## Affected Files

- `lib/types.ts` -- Add Zod schemas and TypeScript types
- `lib/config.ts` -- Add graph-related UI constants (node colors by type, edge styles)

## Recommendations

1. Define Zod schemas for GraphNode, GraphEdge, GraphCluster, GraphData in `lib/types.ts`
2. Add graph-specific UI constants to `lib/config.ts` (NODE_TYPE_COLORS, EDGE_TYPE_STYLES)
3. Design node IDs to be stable across rebuilds (derive from file path, not random)
4. Include position fields on nodes for layout persistence
