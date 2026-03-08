---
title: "Finding: Sprint Sections Expansion and Extraction"
date: "2026-03-05"
updated: "2026-03-06"
project: "kyro-sprint-forge-reader"
type: "analysis"
status: "active"
version: "1.0"
severity: "high"
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

# Finding: Sprint Sections Expansion and Extraction

## Summary

Kyro's `SprintMarkdownSections` has 5 hardcoded keys: `retrospective`, `technicalDebt`, `executionMetrics`, `findings`, `recommendations`. Sprint-forge sprints have 8+ distinct sections with structured content (tables, checklists). The sections need to expand, and Kyro needs extractors to parse structured content from each section's markdown.

## Severity / Impact

**high** — Sprint detail pages display section content. Missing sections means incomplete sprint views. Unparsed tables (debt, disposition, findings consolidation) lose their interactive potential.

## Details

### Current Kyro Sections (`lib/types.ts:46-52`)

```typescript
export const SprintMarkdownSectionsSchema = z.object({
  retrospective: z.string().optional(),
  technicalDebt: z.string().optional(),
  executionMetrics: z.string().optional(),
  findings: z.string().optional(),
  recommendations: z.string().optional(),
});
```

### Sprint-Forge Sections (from template)

| Section | Heading in MD | Kyro Key | Status |
|---|---|---|---|
| Sprint Objective | `## Sprint Objective` | `objective` (field, not section) | Partial |
| Disposition | `## Disposition of Previous Sprint Recommendations` | — | **MISSING** |
| Phases | `## Phases` → `### Phase N` | — (tasks extracted separately) | Different model |
| Emergent Phases | `## Emergent Phases` | — | **MISSING** |
| Findings Consolidation | `## Findings Consolidation` | `findings` | Name collision |
| Accumulated Technical Debt | `## Accumulated Technical Debt` | `technicalDebt` | Exists |
| Definition of Done | `## Definition of Done` | — | **MISSING** |
| Retro | `## Retro` | `retrospective` | Exists |
| Recommendations | `## Recommendations for Sprint N+1` | `recommendations` | Exists |

### Section Content Types

Some sections are plain markdown, others contain structured data:

| Section | Content Type | Interactive? |
|---|---|---|
| Sprint Objective | Plain text | No |
| Disposition | Markdown table | Yes — filterable by action |
| Phases/Tasks | Structured hierarchy | Yes — kanban board |
| Emergent Phases | Structured hierarchy | Yes — same as phases |
| Findings Consolidation | Markdown table | Yes — sortable by impact |
| Technical Debt | Markdown table | Yes — filterable by status |
| Definition of Done | Checkbox list | Yes — toggleable |
| Retro | Markdown subsections | Partially |
| Recommendations | Numbered list | Partially |

### Section Extraction Challenge

Sections need to be extracted from a single markdown body by heading boundaries:

```markdown
## Sprint Objective
Content until next ## heading...

## Disposition of Previous Sprint Recommendations
| # | Recommendation | Action | Where | Justification |
...content until next ## heading...

## Phases
### Phase 1 — Name
...
```

A section extractor needs to:
1. Split the markdown body by `## ` headings
2. Map each heading to a section key
3. Optionally parse tables/checklists within structured sections

### Config Impact (`lib/config.ts`)

`SPRINT_SECTIONS` currently defines 5 tabs for the sprint detail page:

```typescript
export const SPRINT_SECTIONS: SprintSectionMeta[] = [
  { key: "retrospective", label: "Retrospective", ... },
  { key: "technicalDebt", label: "Technical Debt", ... },
  { key: "executionMetrics", label: "Execution Metrics", ... },
  { key: "findings", label: "Findings", ... },
  { key: "recommendations", label: "Recommendations", ... },
];
```

Needs expansion to include disposition, emergent phases, definition of done. `executionMetrics` can be removed or kept as optional.

## Affected Files

- `lib/types.ts` — `SprintMarkdownSectionsSchema` expansion
- `lib/config.ts` — `SPRINT_SECTIONS` array
- `lib/file-format/parsers.ts` — new section extractor function
- `components/pages/sprint-detail-page.tsx` — tab rendering
- `lib/store.ts` — `updateSprintSection()` method

## Recommendations

1. Create a generic `extractSections(markdown: string): Record<string, string>` utility
2. Map section headings to normalized keys via a heading-to-key lookup table
3. Expand `SprintMarkdownSectionsSchema` with new keys: `disposition`, `emergentPhases`, `definitionOfDone`, `sprintObjective`
4. Create specialized parsers for structured sections (tables → typed arrays)
5. Update `SPRINT_SECTIONS` config and sprint detail page component
6. Consider removing `executionMetrics` (sprint-forge doesn't generate it) or keeping as user-custom
