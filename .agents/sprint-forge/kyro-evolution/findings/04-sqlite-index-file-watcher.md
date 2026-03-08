---
title: "Finding: SQLite Index + File Watcher"
created: 2026-03-07
severity: high
agents:
  - claude-opus-4-6
---

# Finding: SQLite Index + File Watcher

## Summary

Cross-file queries are O(n): listing all blocked tasks requires scanning every sprint file, parsing each one fully, then filtering in memory. The search index uses fingerprint-based memoization but rebuilds entirely when data changes — no incremental invalidation. A derived SQLite index plus a file watcher would make queries instant and enable auto-refresh.

## Severity / Impact

**high** — Viable at current scale (3 projects, 15 files) but does not scale to 10+ projects with 15+ sprints each. Blocks dashboard-level aggregations and real-time metrics.

## Details

### Scalability table

| Scenario | Files to parse | Viable |
|----------|---------------|--------|
| 3 projects x 5 sprints | 15 | Yes |
| 10 projects x 15 sprints | 150 | Slow |
| 50 projects x 30 sprints | 1,500 | Unacceptable |

### Current search index (`lib/search.ts`)

- `buildSearchIndex()` constructs a flat array of `SearchItem` from project/sprint/task/finding/debt data
- `useSearchIndex()` hook memoizes on a data fingerprint (D18 resolved)
- When any data changes, the entire index rebuilds — no per-file invalidation

### Proposed solution — SQLite as derived index

**Fundamental rule**: SQLite is an **index derived from markdown**. If corrupted or deleted, it rebuilds from the markdown files. Markdown remains the source of truth.

```
Startup:
  1. Scan all markdown files in workspace
  2. Parse each (existing parsers)
  3. Insert into SQLite: projects, sprints, tasks, findings, debt
  4. Store checksums for incremental invalidation

Query:
  SELECT * FROM tasks WHERE status = 'blocked' AND project_id = 'kyro'
  -> instant, no I/O

File change detected:
  1. Re-parse only the modified file
  2. Update only its rows in SQLite
  3. Emit event for UI refresh
```

### File watcher sub-component

- Monitor project directories with `chokidar` or `fs.watch()`
- On external change (other editor, git pull, sprint-forge CLI): re-parse -> re-index -> push event -> UI updates
- Debounce 500ms to avoid cascade during git operations
- Eliminates the "Refresh Project" button

### Stack options

| Option | Pros | Cons |
|--------|------|------|
| `better-sqlite3` | Fast, mature, server-side | Native bindings, complicates deploy |
| `sql.js` | WASM, no native deps | Slower, larger bundle |

### FTS5 for full-text search

- Index: task titles, finding summaries, document content, sprint objectives
- Replace `buildSearchIndex()` in `lib/search.ts` with FTS5 query

## Affected Files

- `lib/index/sqlite.ts` — new: schema + CRUD
- `lib/index/file-watcher.ts` — new: change detection + re-indexation
- `lib/services/file/projects.file.ts` — migrate to SQLite queries
- `lib/search.ts` — replace `buildSearchIndex` with FTS5
- `app/api/` routes — use index instead of direct filesystem reads

## Recommendations

1. Evaluate `better-sqlite3` vs `sql.js` in first task
2. Define schema: projects, sprints, tasks, findings, debt_items, documents
3. Implement `initIndex()`, `reindexFile()`, `reindexProject()`, `query()`
4. Add file watcher with debounced re-indexation
5. Enable FTS5 for full-text search
6. Add SSE or WebSocket endpoint for push-based UI updates
7. Store file checksums for incremental invalidation on startup
8. Maintain filesystem read as fallback if SQLite not initialized
