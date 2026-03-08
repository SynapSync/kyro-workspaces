---
title: "Finding: Project Model — Internal Directories vs External Pointers"
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
  - "architecture"
changelog:
  - version: "1.0"
    date: "2026-03-05"
    changes: ["Finding documented"]
related:
  - "[[ROADMAP]]"
---

# Finding: Project Model — Internal Directories vs External Pointers

## Summary

Kyro's current project model creates and manages directories inside `$KYRO_WORKSPACE_PATH/projects/{projectId}/`. The target vision requires projects to be **pointers to external sprint-forge directories** anywhere on the filesystem — `.agents/sprint-forge/`, Obsidian vaults, or arbitrary paths. This changes the fundamental I/O model: Kyro reads from external dirs instead of managing its own.

## Severity / Impact

**critical** — This is an architectural shift. The workspace model, API routes, path resolution, and project creation flow all assume internal directories. Every read/write path needs to be rerouted.

## Details

### Current Model

```
$KYRO_WORKSPACE_PATH/                  # e.g., ~/kyro-workspace
├── .kyro/config.json                  # workspace metadata
├── projects/
│   ├── authentication/                # Kyro creates this dir
│   │   ├── README.md                  # Kyro's own format (YAML frontmatter)
│   │   ├── ROADMAP.md                 # Kyro's simplified roadmap
│   │   ├── RE-ENTRY-PROMPTS.md        # Kyro generates this
│   │   ├── documents/                 # Kyro-managed documents
│   │   └── sprints/                   # Kyro-managed sprint files
│   └── matching-algo/
```

### Target Model

```
$KYRO_WORKSPACE_PATH/
├── .kyro/
│   ├── config.json                    # workspace metadata
│   └── projects.json                  # NEW: project registry (name → external path)
└── (no projects/ directory needed)

External directories (read by Kyro):
/path/to/.agents/sprint-forge/auth/    # sprint-forge output
/Users/x/obsidian/matching-algo/       # sprint-forge output in Obsidian
~/projects/dating-app/.agents/sprint-forge/search/
```

### What Changes

| Component | Current | Target |
|---|---|---|
| Project creation | `mkdir $WORKSPACE/projects/{id}` | Register external path in `projects.json` |
| Project listing | `readdir($WORKSPACE/projects/)` | Read `projects.json`, validate each path exists |
| Sprint reading | `readdir($WORKSPACE/projects/{id}/sprints/)` | `readdir({externalPath}/sprints/)` |
| README reading | `$WORKSPACE/projects/{id}/README.md` | `{externalPath}/README.md` |
| ROADMAP reading | `$WORKSPACE/projects/{id}/ROADMAP.md` | `{externalPath}/ROADMAP.md` |
| Findings reading | N/A | `readdir({externalPath}/findings/)` |
| Path guard | `resolveAndGuard(workspacePath, ...)` | Guard must work per-project with different roots |
| Write operations | Write to own dirs | Read-only for external? Or write-back to sprint-forge dirs? |

### Security Consideration

`resolveAndGuard()` in `lib/api/workspace-guard.ts` prevents path traversal by ensuring all paths are within `$KYRO_WORKSPACE_PATH`. With external directories, this guard needs to allow project-specific root paths while still preventing traversal outside each project's dir.

### Project Registry Schema (proposed)

```json
{
  "projects": [
    {
      "id": "auth-sprint",
      "name": "Authentication",
      "path": "/path/to/.agents/sprint-forge/auth/",
      "addedAt": "2026-03-05T10:00:00Z"
    },
    {
      "id": "matching-algo",
      "name": "Matching Algorithm",
      "path": "/Users/x/obsidian/matching-algo/",
      "addedAt": "2026-03-05T10:05:00Z"
    }
  ]
}
```

## Affected Files

- `lib/api/workspace-guard.ts` — `getWorkspacePath()`, `resolveAndGuard()`
- `app/api/projects/route.ts` — `GET` (list), `POST` (create)
- `app/api/projects/[projectId]/route.ts` — `GET`, `PUT`, `DELETE`
- `app/api/projects/[projectId]/sprints/route.ts` — path resolution
- `app/api/projects/[projectId]/documents/route.ts` — may become irrelevant
- `lib/file-format/parsers.ts` — `parseProjectReadme()` (sprint-forge README has no frontmatter)
- `lib/file-format/templates.ts` — `syncWorkspaceAgentDocs()`, `syncProjectReentryPrompts()`
- `lib/services/types.ts` — `CreateProjectInput` needs `path` field
- `lib/store.ts` — `addProject()` flow
- UI: project creation dialog needs directory picker

## Recommendations

1. Create `$WORKSPACE/.kyro/projects.json` as the project registry
2. Each project entry stores: id, display name, external absolute path, added timestamp
3. API routes resolve paths from the registry, not from filesystem convention
4. `resolveAndGuard()` should accept a per-project root path
5. Project creation = registering a path (validate it's a valid sprint-forge directory)
6. Consider read-only mode initially — Kyro reads but doesn't write to sprint-forge dirs
7. Add path validation: check that the directory has README.md + sprints/ subdirectory
