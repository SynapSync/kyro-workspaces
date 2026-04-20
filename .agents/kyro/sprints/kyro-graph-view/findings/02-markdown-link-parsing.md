---
title: "Finding: Markdown Link & Reference Parsing"
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

# Finding: Markdown Link & Reference Parsing

## Summary

A dedicated parser is needed to extract all inter-file references from markdown content: [[wiki-links]], standard markdown links, YAML frontmatter `related` fields, and tags. The existing parsers in `lib/file-format/` already handle frontmatter and sections but do not extract cross-file references.

## Severity / Impact

critical -- The parser is the data source for the entire graph. Without reliable link extraction, the graph will be incomplete or incorrect.

## Details

### Current Parsing Infrastructure

The existing `lib/file-format/` directory has:
- `parsers.ts` -- `parseProjectReadme()`, `parseSprintFile()`, `parseDocumentFile()` using gray-matter
- `sprint-forge-parsers.ts` -- `parseSprintForgeFile()`, `parseFindingFile()`, `detectSprintFormat()`
- `markdown-utils.ts` -- `extractSections()`, `parseMarkdownTable()`, `extractBlockquoteMetadata()`

None of these extract cross-file links or references.

### Links to Extract

1. **Wiki-links**: `[[ROADMAP]]`, `[[SPRINT-01-architecture]]`, `[[RE-ENTRY-PROMPTS]]`
   - Already used in sprint-forge frontmatter `related` fields
   - Pattern: `\[\[([^\]]+)\]\]`

2. **Standard markdown links**: `[text](path/to/file.md)`, `[text](../other-file.md)`
   - Need to resolve relative paths to absolute
   - Distinguish internal links (to project files) from external URLs

3. **Frontmatter references**: `related: ["[[ROADMAP]]", "[[RE-ENTRY-PROMPTS]]"]`
   - Already parsed by gray-matter but not extracted as graph edges
   - Sprint files have `source`, `previousSprint`, `previousDoc`, `nextDoc` fields

4. **Tags**: Files sharing the same tag should have weak edges
   - Frontmatter `tags` arrays already parsed
   - Weight should be proportional to tag overlap

5. **Sprint-to-finding links**: Sprint files reference finding files via `source` field
   - E.g., `> Source: findings/01-architecture-issues.md`

### Resolution Strategy

- Wiki-links: resolve by matching against known file names (case-insensitive, with/without extension)
- Relative paths: resolve against the file's directory
- Tags: build a tag-to-files index, then create edges for files sharing tags

## Affected Files

- `lib/file-format/graph-parser.ts` (new) -- Link extraction functions
- `lib/file-format/markdown-utils.ts` -- May need new regex helpers

## Recommendations

1. Create `lib/file-format/graph-parser.ts` with pure functions: `extractWikiLinks()`, `extractMarkdownLinks()`, `extractFrontmatterRefs()`, `extractTags()`
2. Create a unified `extractFileReferences(content, filePath)` that returns all references from a file
3. Build a resolution layer that maps extracted references to actual file paths
4. Reuse gray-matter for frontmatter parsing (already a dependency)
5. Write extensive unit tests -- link parsing is the most error-prone part
