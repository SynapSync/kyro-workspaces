---
title: "Finding: ROADMAP.md and README.md Parsing for Sprint-Forge Format"
date: "2026-03-05"
updated: "2026-03-06"
project: "kyro-sprint-forge-reader"
type: "analysis"
status: "active"
version: "1.0"
severity: "medium"
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

# Finding: ROADMAP.md and README.md Parsing for Sprint-Forge Format

## Summary

Sprint-forge generates rich `ROADMAP.md` and `README.md` files with specific structures (blockquote metadata, tables, dependency maps). Kyro currently generates its own simplified versions of these files and parses README via YAML frontmatter. Kyro needs parsers for the sprint-forge format of both files to display project overview, sprint planning, and dependency information.

## Severity / Impact

**high** — The roadmap is the central planning artifact of sprint-forge. Without parsing it, Kyro can't show sprint dependencies, planned work, or project-level metadata. The README contains the project's identity and reading protocol.

## Details

### README.md — Sprint-Forge Format

```markdown
# {project_name} — Working Project

> Type: refactor
> Created: 2026-02-20
> Codebase: `/path/to/code`

---

## What Is This
This directory contains the working artifacts for...

## Directory Structure
...

## Absolute Paths
| Resource | Path |
|----------|------|
| Codebase | `/path/to/code` |
| Working Directory | `/path/to/sprint-forge/dir` |
...

## Current State — Baseline
| Metric | Value |
|--------|-------|
...

## Sprint Map
| Sprint | Status | Focus | Key Deliverables |
...
```

### README.md — Current Kyro Parser

```typescript
// lib/file-format/parsers.ts:155-168
export function parseProjectReadme(content: string, slug: string) {
  const { data, content: body } = matter(content);  // YAML frontmatter
  return {
    id: data.id ?? slug,
    name: data.name ?? slug,
    description: data.description ?? "",
    readme: body.trim(),
    createdAt: data.createdAt ?? now,
    updatedAt: data.updatedAt ?? now,
  };
}
```

**Problem**: Sprint-forge README has NO frontmatter. Parser returns all defaults.

### ROADMAP.md — Sprint-Forge Format

Rich structure with:
1. **Project Paths** table — codebase, working dir, findings, sprints paths
2. **Execution Rules** — 9 non-negotiable rules
3. **Task States** — symbol reference table
4. **Sprint Summary** table — each planned sprint with source, version, type, focus, dependencies, status
5. **Detailed Sprint Definitions** — per-sprint breakdown with source, phases, dependencies
6. **Dependency Map** — ASCII diagram showing sprint dependencies

### ROADMAP.md — Current Kyro Version

```markdown
# ROADMAP — {name}
> Este roadmap es un documento vivo.

## Sprints
| Sprint | Focus | Status |
|--------|-------|--------|
| 1 | _(definir)_ | pending |
```

Kyro generates a placeholder. It never reads/parses the roadmap for display.

### What Kyro Needs to Extract from ROADMAP

| Data | Usage |
|---|---|
| Sprint Summary table | Project overview: how many sprints, their status, focus areas |
| Dependencies | Visualize sprint dependencies (e.g., "Sprint 3 blocked by Sprint 1+2") |
| Sprint types | Color-code sprints by type (audit=blue, feature=green, etc.) |
| Project paths | Validate that external directory is consistent |

### What Kyro Needs to Extract from README

| Data | Usage |
|---|---|
| Project name | Display in sidebar/header |
| Work type | Project badge |
| Codebase path | Link to source |
| Sprint Map | Quick status overview |
| Baseline metrics | Project overview dashboard |

## Affected Files

- `lib/file-format/parsers.ts` — `parseProjectReadme()` needs sprint-forge variant
- `lib/file-format/parsers.ts` — new `parseRoadmap()` function needed
- `lib/types.ts` — `Project` type needs roadmap data, `RoadmapSummary` type
- `app/api/projects/route.ts` — project listing reads README
- `components/pages/project-overview.tsx` — dashboard needs roadmap data
- `lib/file-format/templates.ts` — `buildDefaultProjectRoadmap()` should be reconsidered

## Recommendations

1. Create `parseSprintForgeReadme()` that extracts project name from `# Title — Working Project` heading, metadata from blockquotes, and tables from body
2. Create `parseRoadmap()` that extracts Sprint Summary table and Detailed Sprint Definitions
3. Add `RoadmapSummary` type with sprint plan array and dependency map
4. Update project overview page to display roadmap data (sprint plan, dependencies, types)
5. Consider a generic markdown table parser for reuse across README, ROADMAP, and sprint sections
