---
title: "Finding: Workspace Configuration and Project Registry"
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

# Finding: Workspace Configuration and Project Registry

## Summary

Kyro's workspace model assumes a single root directory (`$KYRO_WORKSPACE_PATH`) containing all project data. The target architecture needs a project registry that maps project IDs to external directories. This affects workspace initialization, the config schema, API route resolution, and the onboarding flow.

## Severity / Impact

**medium** — The workspace itself is a thin coordination layer. The registry is straightforward to implement, but it touches the init flow, config schema, and every API route's path resolution.

## Details

### Current Workspace Structure

```
$KYRO_WORKSPACE_PATH/
├── .kyro/
│   ├── config.json        # { id, name, description, createdAt, updatedAt }
│   ├── members.json       # TeamMember[]
│   └── activities.json    # AgentActivity[]
├── README.md              # auto-generated workspace overview
├── AGENTS.md              # auto-generated agent protocol
└── projects/              # convention-based project discovery
    ├── project-a/
    └── project-b/
```

### Target Workspace Structure

```
$KYRO_WORKSPACE_PATH/
├── .kyro/
│   ├── config.json        # workspace metadata (unchanged)
│   ├── projects.json      # NEW: project registry
│   ├── members.json       # (unchanged)
│   └── activities.json    # (unchanged)
├── README.md              # can be simplified or removed
└── AGENTS.md              # can be simplified or removed
```

### New: projects.json

```json
{
  "version": 1,
  "projects": [
    {
      "id": "auth-sprint",
      "name": "Authentication",
      "path": "/abs/path/to/sprint-forge/auth-project/",
      "color": "#8b5cf6",
      "addedAt": "2026-03-05T10:00:00Z",
      "lastOpenedAt": "2026-03-05T14:30:00Z"
    }
  ]
}
```

### Workspace Init Flow Changes

Current (`app/api/workspace/init/route.ts`):
1. Create `$WORKSPACE/.kyro/` directory
2. Write `config.json`, `members.json`, `activities.json`
3. Create `projects/` directory
4. Write `README.md`, `AGENTS.md`

Target:
1. Create `$WORKSPACE/.kyro/` directory
2. Write `config.json`, `projects.json` (empty), `members.json`, `activities.json`
3. `README.md` and `AGENTS.md` become optional
4. No `projects/` directory needed

### Template Sync Changes

`syncWorkspaceAgentDocs()` in `templates.ts` generates `README.md` and `AGENTS.md` by listing projects from the `projects/` directory. In the new model:
- It should read from `projects.json` instead
- Or be removed entirely if these docs aren't needed for external directories

`syncProjectReentryPrompts()` writes `RE-ENTRY-PROMPTS.md` inside the project directory. For external dirs, Kyro should either:
- Write to the external dir (if user grants write access)
- Skip it (sprint-forge already generates its own re-entry prompts)

### Activities Scoping

Activities are currently stored globally in `.kyro/activities.json` with a `projectId` field. This still works with external projects — the projectId maps to the registry entry. No change needed.

## Affected Files

- `lib/file-format/parsers.ts` — new `parseProjectRegistry()` function
- `lib/file-format/serializers.ts` — new `serializeProjectRegistry()` function
- `lib/types.ts` — new `ProjectRegistryEntry`, `ProjectRegistry` types
- `app/api/workspace/init/route.ts` — init flow changes
- `app/api/projects/route.ts` — `GET` reads registry, `POST` adds to registry
- `app/api/projects/[projectId]/route.ts` — resolves path from registry
- `lib/file-format/templates.ts` — `syncWorkspaceAgentDocs()`, `syncProjectReentryPrompts()`
- `lib/api/workspace-guard.ts` — `resolveAndGuard()` needs per-project root

## Recommendations

1. Create `projects.json` schema and parser
2. Add API endpoint to add/remove projects from registry
3. Project creation = validate path + add to registry (no directory creation)
4. Path validation on add: check for README.md and sprints/ in the target directory
5. Keep activities global — filter by projectId in the UI
6. Defer write-back to external dirs (start read-only)
