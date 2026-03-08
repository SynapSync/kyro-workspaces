---
title: "Finding: Sprint File Format Incompatibility"
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

# Finding: Sprint File Format Incompatibility

## Summary

Kyro's `parseSprintFile()` expects YAML frontmatter (via `gray-matter`) to extract sprint metadata (id, name, status, dates, objective). Sprint-forge generates sprint files with NO frontmatter — metadata lives in the `# Sprint N — title` heading and `> Source:`, `> Version Target:`, `> Type:` blockquotes. When Kyro parses a sprint-forge file, it returns default/empty values for all fields.

## Severity / Impact

**critical** — This is the foundational incompatibility. Without fixing this, Kyro cannot read ANY sprint-forge data. Every downstream feature (kanban, sprint detail, project overview) depends on correct sprint parsing.

## Details

### Current Parser (`lib/file-format/parsers.ts:123-149`)

```typescript
export function parseSprintFile(content: string): Sprint {
  const { data, content: body } = matter(content);  // expects YAML frontmatter
  // data.id, data.name, data.status, etc. — ALL empty for sprint-forge files
}
```

### Sprint-Forge Format (no frontmatter)

```markdown
# Sprint 1 — Foundation

> Source: `findings/01-architecture.md`
> Previous Sprint: `sprints/SPRINT-1-foundation.md` | None
> Version Target: 0.2.0
> Type: refactor
> Carry-over: 0 items from previous sprint
> Execution Date: 2026-03-01
> Executed By: Claude

## Sprint Objective
Clear description of what this sprint accomplishes.
```

### What Kyro Returns for Sprint-Forge Files

```typescript
{
  id: "sprint-unknown",     // fallback
  name: "Sprint",           // fallback
  status: "planned",        // fallback — can't detect active/closed
  startDate: undefined,
  endDate: undefined,
  version: undefined,
  objective: undefined,
  tasks: [],                // task extraction also fails (see Finding 02)
  sections: undefined,
}
```

### New Metadata Fields in Sprint-Forge

Sprint-forge has metadata fields that don't exist in Kyro's type system:

| Sprint-Forge Field | Kyro Equivalent | Gap |
|---|---|---|
| Source (finding file) | — | New field needed |
| Previous Sprint | — | New field needed |
| Version Target | `version` | Exists |
| Type (audit/refactor/feature/bugfix/debt) | — | New field needed |
| Carry-over count | — | New field needed |
| Execution Date | `startDate` / `endDate` | Partial mapping |
| Executed By | — | New field needed |

## Affected Files

- `lib/file-format/parsers.ts` — `parseSprintFile()` function
- `lib/types.ts` — `SprintSchema`, `Sprint` type
- `app/api/projects/[projectId]/sprints/route.ts` — calls `parseSprintFile()`
- `app/api/projects/[projectId]/sprints/[sprintId]/route.ts` — calls `parseSprintFile()`
- `lib/api/sprint-files.ts` — `resolveSprintFilePath()` also calls `parseSprintFile()`

## Recommendations

1. Create a new parser `parseSprintForgeFile()` that extracts metadata from heading + blockquotes
2. Add a format detection function that auto-detects YAML frontmatter vs sprint-forge format
3. Extend `SprintSchema` with new fields: `source`, `previousSprint`, `sprintType`, `carryOverCount`, `executedBy`
4. Keep backward compatibility: if frontmatter exists, use current parser; if not, use sprint-forge parser
