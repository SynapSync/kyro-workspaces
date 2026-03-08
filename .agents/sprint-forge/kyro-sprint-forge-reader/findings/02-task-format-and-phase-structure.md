---
title: "Finding: Task Format and Phase Structure Incompatibility"
date: "2026-03-05"
updated: "2026-03-06"
project: "kyro-sprint-forge-reader"
type: "analysis"
status: "active"
version: "1.0"
severity: "critical"
agents:
  - "claude-opus-4-6"
tags:
  - "kyro-sprint-forge-reader"
  - "analysis"
  - "finding"
  - "parsing"
changelog:
  - version: "1.0"
    date: "2026-03-05"
    changes: ["Finding documented"]
related:
  - "[[ROADMAP]]"
---

# Finding: Task Format and Phase Structure Incompatibility

## Summary

Kyro's task extraction regex `^- \[(.)\] (.+)$` captures simple task titles but fails to properly parse sprint-forge's rich task format: `- [ ] **T1.1**: description` with indented sub-items (Files, Evidence, Verification). Furthermore, sprint-forge organizes tasks under `## Phases` → `### Phase N — Name`, while Kyro only recognizes generic headings. The entire phase/task hierarchy is lost.

## Severity / Impact

**critical** — Tasks are the core data unit displayed in the kanban board. Without correct task parsing, the board shows mangled titles and loses all task metadata (files, evidence, verification, phase context).

## Details

### Current Task Regex (`lib/file-format/parsers.ts:90`)

```typescript
const TASK_LINE_RE = /^- \[(.)\] (.+)$/;
```

This captures:
- `- [x] **T1.1**: Configure CI/CD pipeline` → title = `**T1.1**: Configure CI/CD pipeline` (includes bold markdown)
- Sub-items are completely ignored (they don't match the regex)

### Sprint-Forge Task Format

```markdown
### Phase 1 — Infrastructure Setup

**Objective**: Set up the foundational infrastructure

**Tasks**:

- [ ] **T1.1**: Configure CI/CD pipeline
  - Files: `ci.yml`, `.github/workflows/deploy.yml`
  - Evidence: Pipeline runs green on main branch
  - Verification: `gh run list --limit 5` shows all green

- [~] **T1.2**: Set up database migrations
  - Files: `db/migrations/`, `lib/db.ts`
  - Evidence: Migration log shows 0 pending
  - Verification: `npx prisma migrate status`
```

### What Kyro Currently Extracts

```typescript
[
  { symbol: " ", title: "**T1.1**: Configure CI/CD pipeline", phase: "Phase 1 — Infrastructure Setup" },
  { symbol: "~", title: "**T1.2**: Set up database migrations", phase: "Phase 1 — Infrastructure Setup" },
]
// Sub-items (Files, Evidence, Verification) → LOST
// Bold task ID in title → NOT stripped
// Phase objective → LOST
```

### Missing Data Model Concepts

| Sprint-Forge Concept | Kyro Type | Gap |
|---|---|---|
| Task ID (`T1.1`, `T2.3`, `TE.1`) | Generated UUID | Need to preserve original ID |
| Phase grouping with objectives | `description: "[phase:Phase 1]"` hack | Need first-class Phase type |
| Files affected per task | — | New field needed |
| Evidence per task | — | New field needed |
| Verification per task | — | New field needed |
| Emergent task IDs (`TE.1`) | — | Need to distinguish emergent tasks |

### Phase Heading Detection

Current regex (`parsers.ts:93`):
```typescript
const PHASE_HEADING_RE = /^#{2,4}\s+(Phase|Fase)\s+\d+/i;
```

This does match sprint-forge phase headings, but:
- Doesn't capture the phase objective
- Doesn't distinguish between regular phases and emergent phases (`### Emergent Phase — Name`)
- Stores phase name only as a `description` string hack: `[phase:Phase 1 — Name]`

## Affected Files

- `lib/file-format/parsers.ts` — `extractTasksFromBody()`, `TASK_LINE_RE`, `PHASE_HEADING_RE`
- `lib/types.ts` — `TaskSchema`, `Task` type
- `lib/file-format/serializers.ts` — `taskToSymbol()`, `phaseFromTask()`
- `components/kanban/task-card.tsx` — renders task title (will show `**T1.1**: ...`)
- `lib/config.ts` — no `Phase` concept in config

## Recommendations

1. Create a rich task parser that extracts: task ID, clean title, files, evidence, verification
2. Add a `Phase` type with: id, name, objective, tasks array
3. Strip bold markdown from task IDs: `**T1.1**: desc` → id=`T1.1`, title=`desc`
4. Parse emergent phases separately (`### Emergent Phase — Name`)
5. Extend `Task` type with optional fields: `taskRef`, `files`, `evidence`, `verification`
6. Update `TaskCard` to display file/evidence info on hover or in detail view
