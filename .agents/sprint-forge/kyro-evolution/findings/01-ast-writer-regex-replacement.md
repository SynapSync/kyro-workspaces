---
title: "Finding: AST Writer — Replace Regex Patching"
created: 2026-03-07
severity: critical
agents:
  - claude-opus-4-6
---

# Finding: AST Writer — Replace Regex Patching

## Summary

All markdown write operations use fragile regex find-and-replace patterns. This blocks every future writing feature and creates an ever-growing surface of edge-case failures. The fix is to parse markdown into an AST (via `unified` + `remark`), modify nodes in the tree, and serialize back.

## Severity / Impact

**critical** — Blocks all expansion of write functionality. Every new operation requires a hand-crafted regex, and edge cases multiply with brackets in titles, indented sub-tasks, and varying formats.

## Details

Current write operations in the codebase:

- `patchTaskStatusInMarkdown()` — regex to swap checkbox symbol `[ ]`/`[x]`/`[~]` etc.
- `patchSprintStatusInMarkdown()` — regex to change sprint-level status marker
- `appendTaskToMarkdown()` — regex to locate a phase heading and append a task line

Each regex is artisanal and tested against a narrow set of patterns. Known failure scenarios:

```markdown
- [x] **T1.1**: Create "type [schemas]"    # brackets in title can confuse regex
  - Subtask indentada                       # regex doesn't handle nesting depth
- [x] Create schemas                        # no task ref — different pattern
```

The pattern of fragility is inherent to find-and-replace on plain text without formal validation.

### Reference model — Obsidian

Obsidian solved this exact problem: it uses a structured document model (CodeMirror 6 AST) for writes, never regex. Operations are transformations on the model, serialized back to markdown on save.

### Proposed solution — `unified` + `remark`

```
Write operation:
  1. Read markdown file
  2. Parse to AST with remark-parse
  3. Locate node in tree (by type, position, content)
  4. Modify node (change status, text, add child)
  5. Serialize AST back to markdown with remark-stringify
  6. Write file
```

**Risk**: `remark-stringify` may reformat existing markdown (spacing, lists). Needs careful configuration to preserve original format.

## Affected Files

- `lib/file-format/serializers.ts` — contains all regex patching functions
- `app/api/projects/[id]/sprints/[sprintId]/route.ts` — Sprint PUT uses regex patch
- `app/api/projects/[id]/sprints/[sprintId]/tasks/route.ts` — Tasks POST uses regex append
- `app/api/projects/[id]/sprints/[sprintId]/tasks/[taskId]/route.ts` — Task PUT uses regex patch

## Recommendations

1. Install `unified` + `remark-parse` + `remark-stringify` as dependencies
2. Create `lib/file-format/ast-writer.ts` with pure functions: `updateTaskStatus()`, `appendTask()`, `updateFrontmatterField()`
3. Migrate all three regex functions to AST-based equivalents
4. Update API routes to use the new AST writer
5. Delete all regex write functions from `serializers.ts`
6. Write round-trip tests: read -> parse -> modify -> serialize -> verify file integrity
7. Configure `remark-stringify` to preserve original formatting (bullet style, list indentation)
