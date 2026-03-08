---
title: "Finding: Missing Domain Concepts — Findings, Debt Items, Phases, Disposition"
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
  - "domain-model"
changelog:
  - version: "1.0"
    date: "2026-03-05"
    changes: ["Finding documented"]
related:
  - "[[ROADMAP]]"
---

# Finding: Missing Domain Concepts — Findings, Debt Items, Phases, Disposition

## Summary

Sprint-forge produces several structured data types that have no representation in Kyro's type system: Findings (analysis artifacts), structured Debt Items (with origin, target sprint, status lifecycle), Phases (with objectives and grouped tasks), Disposition entries (recommendation tracking), and Definition of Done checklists. Kyro needs first-class types for these to display and navigate sprint-forge data meaningfully.

## Severity / Impact

**high** — Without these types, Kyro can at best show raw markdown. With proper types, it can render interactive tables, filterable debt trackers, phase progress bars, and finding-to-sprint traceability.

## Details

### Missing Type: Finding

Sprint-forge generates `findings/NN-slug.md`:

```markdown
# Finding: Architecture Layer Violations

## Summary
Service layer imports directly from components...

## Severity / Impact
high — Causes circular dependencies...

## Details
...

## Affected Files
- `lib/services/foo.ts`
- `components/bar.tsx`

## Recommendations
1. Extract shared types to a separate module
2. Add lint rule for import boundaries
```

**Proposed Zod schema:**
```typescript
const FindingSchema = z.object({
  id: z.string(),           // "01-architecture-layers"
  number: z.number(),       // 1
  title: z.string(),        // "Architecture Layer Violations"
  summary: z.string(),
  severity: z.enum(["critical", "high", "medium", "low"]),
  details: z.string(),      // markdown body
  affectedFiles: z.array(z.string()),
  recommendations: z.array(z.string()),
  linkedSprints: z.array(z.string()).optional(), // which sprints address this
});
```

### Missing Type: DebtItem (structured)

Sprint-forge debt table:

```markdown
| # | Item | Origin | Sprint Target | Status | Resolved In |
|---|------|--------|--------------|--------|-------------|
| D1 | Missing auth middleware | Sprint 1 Phase 2 | Sprint 3 | open | — |
| D2 | Stale test fixtures | INIT finding 02 | Sprint 2 | resolved | Sprint 2 |
```

**Proposed Zod schema:**
```typescript
const DebtItemSchema = z.object({
  number: z.number(),        // 1
  item: z.string(),          // "Missing auth middleware"
  origin: z.string(),        // "Sprint 1 Phase 2"
  sprintTarget: z.string(),  // "Sprint 3"
  status: z.enum(["open", "in-progress", "resolved", "deferred", "carry-over"]),
  resolvedIn: z.string().optional(),  // "Sprint 2"
});
```

### Missing Type: Phase

```typescript
const PhaseSchema = z.object({
  id: z.string(),            // "phase-1", "emergent-1"
  name: z.string(),          // "Infrastructure Setup"
  objective: z.string(),
  isEmergent: z.boolean(),   // false for planned, true for emergent
  tasks: z.array(TaskSchema),
});
```

### Missing Type: DispositionEntry

```typescript
const DispositionEntrySchema = z.object({
  number: z.number(),
  recommendation: z.string(),
  action: z.enum(["incorporated", "deferred", "resolved", "n/a", "converted-to-phase"]),
  where: z.string(),         // "Phase 2, Task T2.1" or "Sprint 5"
  justification: z.string(),
});
```

### Missing Type: SprintType

```typescript
const SprintTypeSchema = z.enum(["audit", "refactor", "feature", "bugfix", "debt"]);
```

### Impact on Sprint Schema

Current Sprint has `tasks: Task[]` (flat list). Target Sprint should have:
- `phases: Phase[]` (each containing tasks)
- `disposition: DispositionEntry[]`
- `debtItems: DebtItem[]`
- `definitionOfDone: string[]` (checklist items)
- `sprintType: SprintType`
- `source: string` (finding file reference)

## Affected Files

- `lib/types.ts` — needs new schemas and types
- `lib/file-format/parsers.ts` — needs parsers for each new type
- `lib/config.ts` — needs configs for new section display
- `lib/store.ts` — needs state management for new entities
- `lib/services/types.ts` — needs service methods for findings
- Components: new views for findings, debt tracker, disposition table

## Recommendations

1. Add all proposed Zod schemas to `lib/types.ts`
2. Create parsers in `lib/file-format/parsers.ts` for:
   - Finding files (markdown heading + sections extraction)
   - Debt table (markdown table parsing)
   - Disposition table (markdown table parsing)
   - Definition of Done (checklist parsing)
3. Consider a generic markdown table parser utility
4. Add `FindingsService` to service interfaces
5. Phase the implementation: types first, then parsers, then UI
