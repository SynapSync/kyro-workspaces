---
title: "Sprint 2 — Project Registry & API Route Refactor"
date: "2026-03-05"
updated: "2026-03-06"
project: "kyro-sprint-forge-reader"
type: "sprint-plan"
status: "completed"
version: "1.0"
sprint: 2
progress: 100
previous_doc: "[[SPRINT-1-domain-types-and-parsers]]"
next_doc: "[[SPRINT-3-service-layer-and-store-adaptation]]"
parent_doc: "[[ROADMAP]]"
agents:
  - "claude-opus-4-6"
tags:
  - "kyro-sprint-forge-reader"
  - "sprint-plan"
  - "sprint-2"
changelog:
  - version: "1.0"
    date: "2026-03-05"
    changes: ["Sprint generated and executed"]
related:
  - "[[ROADMAP]]"
  - "[[03-project-model-external-directories]]"
  - "[[07-workspace-config-and-project-registry]]"
---

# Sprint 2 — Project Registry & API Route Refactor

> Source: `findings/03-project-model-external-directories.md`, `findings/07-workspace-config-and-project-registry.md`
> Previous Sprint: `sprints/SPRINT-1-domain-types-and-parsers.md`
> Version Target: 0.3.0
> Type: refactor
> Carry-over: 0 items from previous sprint
> Execution Date: 2026-03-05
> Executed By: Claude
> Status: complete
> Result: 22/22 tasks completed, 100 tests pass (13 test files)

---

## Sprint Objective

Replace Kyro's internal project directory model (`$WORKSPACE/projects/{id}/`) with an external directory registry (`projects.json`). After this sprint, Kyro will list projects from a registry file, read sprint/finding/roadmap data from external sprint-forge directories anywhere on the filesystem, and support adding/removing projects by path instead of creating internal directories. All API routes will resolve paths from the registry, and `resolveAndGuard()` will support per-project root paths.

---

## Disposition of Previous Sprint Recommendations

| # | Recommendation | Action | Where | Justification |
|---|---------------|--------|-------|---------------|
| 1 | Use `parseSprintForgeReadme()` for path validation when adding projects to registry | Incorporated | Phase 1, T1.3 | Registry add validates README.md format using Sprint 1 parser |
| 2 | Update `resolveAndGuard()` for per-project root path from registry | Incorporated | Phase 2, T2.1 | New `resolveProjectPath()` uses registry entry's path as root |
| 3 | API routes should return both `tasks` (flat) and `phases` (structured) | Incorporated | Phase 3, T3.3 | Sprint GET endpoint returns SprintForgeSprint with phases when available |
| 4 | Add `index.ts` barrel export in `lib/file-format/` | Incorporated | Phase 3, T3.5 | Creates barrel export for cleaner imports |
| 5 | Debt table parser strips `D` prefix — serializer should re-add if write support needed | Deferred | Sprint 3+ | Kyro is read-only for sprint-forge dirs in this sprint; write-back deferred |

---

## Phases

### Phase 1 — Project Registry

**Objective**: Create `projects.json` schema, parser, serializer, and registry management utilities.

**Tasks**:

- [x] **T1.1**: Add `ProjectRegistryEntrySchema` and `ProjectRegistrySchema` Zod types — entry has id, name, path (absolute), color (optional), addedAt, lastOpenedAt (optional)
  - Files: `lib/types.ts`
  - Evidence: Schemas added with full Zod validation
  - Verification: ✅ Schema validates sample registry entries

- [x] **T1.2**: Create `lib/file-format/registry.ts` with `parseProjectRegistry(json: string): ProjectRegistry` and `serializeProjectRegistry(registry: ProjectRegistry): string`
  - Files: `lib/file-format/registry.ts`
  - Evidence: Functions created with JSON.parse/stringify + Zod validation
  - Verification: ✅ Round-trip parse/serialize preserves data (tested)

- [x] **T1.3**: Add `validateSprintForgeDirectory(dirPath: string): Promise<{ valid: boolean; name?: string; error?: string }>` — checks for README.md (optionally parses with `parseSprintForgeReadme()`), sprints/ directory existence
  - Files: `lib/file-format/registry.ts`
  - Evidence: Validates README.md presence and sprints/ dir existence
  - Verification: ✅ Returns valid=true for fixture, valid=false for invalid dirs (3 test cases)

- [x] **T1.4**: Add registry CRUD helpers — `addProject(registryPath, entry)`, `removeProject(registryPath, projectId)`, `getProject(registryPath, projectId)`, `listProjects(registryPath)` — all read/write to projects.json
  - Files: `lib/file-format/registry.ts`
  - Evidence: All CRUD functions with file I/O
  - Verification: ✅ 6 tests covering add, remove, get, list, duplicate rejection

- [x] **T1.5**: Add `updateLastOpened(registryPath, projectId)` — updates `lastOpenedAt` timestamp when a project is accessed
  - Files: `lib/file-format/registry.ts`
  - Evidence: Updates timestamp on matching entry
  - Verification: ✅ Timestamp updates correctly (tested)

### Phase 2 — Path Resolution Refactor

**Objective**: Update `resolveAndGuard()` and create `resolveProjectPath()` to support per-project external root paths from the registry.

**Tasks**:

- [x] **T2.1**: Add `resolveProjectPath(projectRoot: string, ...segments: string[]): string` — resolves and guards paths relative to a project's external root directory (same traversal protection as `resolveAndGuard` but with project-specific root)
  - Files: `lib/api/workspace-guard.ts`
  - Evidence: Same traversal protection as `resolveAndGuard` with per-project root
  - Verification: ✅ 4 unit tests: valid paths, traversal prevention, absolute path rejection

- [x] **T2.2**: Add `getRegistryPath(workspacePath: string): string` — returns the path to `$WORKSPACE/.kyro/projects.json`
  - Files: `lib/api/workspace-guard.ts`
  - Evidence: Simple path.join helper
  - Verification: ✅ Returns correct absolute path

- [x] **T2.3**: Add `resolveProjectRoot(workspacePath: string, projectId: string): Promise<string>` — reads registry, finds project by ID, returns its external root path
  - Files: `lib/api/workspace-guard.ts`
  - Evidence: Reads registry, finds project, returns path; throws NOT_FOUND for unknown
  - Verification: ✅ Integrated via API route tests

### Phase 3 — API Routes Refactor

**Objective**: Refactor all project and sprint API routes to read from the registry and external directories instead of `$WORKSPACE/projects/`.

**Tasks**:

- [x] **T3.1**: Refactor `GET /api/projects` — read from `projects.json` registry; for each entry, read README.md from external path using `parseProjectReadme()` (with auto-detection from Sprint 1)
  - Files: `app/api/projects/route.ts`
  - Evidence: Reads registry, enriches with README data, includes `_available` flag
  - Verification: ✅ Integration test confirms project listing from registry

- [x] **T3.2**: Refactor `POST /api/projects` — accept `{ path, name?, color? }` body; validate sprint-forge dir; add to registry (no mkdir)
  - Files: `app/api/projects/route.ts`
  - Evidence: Validates dir, generates slug ID, adds to registry
  - Verification: ✅ Integration test: register + list; invalid dir rejection; duplicate rejection

- [x] **T3.3**: Refactor `GET /api/projects/[projectId]/sprints` — resolve project root from registry; read sprints from external `{projectRoot}/sprints/`; return SprintForgeSprint when sprint-forge format detected (with phases)
  - Files: `app/api/projects/[projectId]/sprints/route.ts`
  - Evidence: Resolves from registry, reads external sprints dir, auto-detects format
  - Verification: ✅ Integration test reads sprints from external fixture

- [x] **T3.4**: Refactor `GET /api/projects/[projectId]` — resolve from registry; read README from external path
  - Files: `app/api/projects/[projectId]/route.ts`
  - Evidence: Resolves project root from registry, reads external README
  - Verification: ✅ Updates lastOpenedAt on access

- [x] **T3.5**: Create `lib/file-format/index.ts` barrel export — re-export all parsers and sprint-forge parsers for cleaner imports
  - Files: `lib/file-format/index.ts`
  - Evidence: Barrel export created
  - Verification: ✅ Consumers import from `@/lib/file-format`

- [x] **T3.6**: Refactor `DELETE /api/projects/[projectId]` — remove from registry only (never delete external directory); remove `syncWorkspaceAgentDocs` call
  - Files: `app/api/projects/[projectId]/route.ts`
  - Evidence: Removes from registry, never touches external dir
  - Verification: ✅ Integration test confirms external dir intact after delete

- [x] **T3.7**: Remove or simplify `PUT /api/projects/[projectId]` — only update registry metadata (name, color); do not write to external dir
  - Files: `app/api/projects/[projectId]/route.ts`
  - Evidence: Updates name/color in registry only
  - Verification: ✅ Integration test updates name and color

- [x] **T3.8**: Add `GET /api/projects/[projectId]/findings` — list and return parsed findings from external `{projectRoot}/findings/`
  - Files: `app/api/projects/[projectId]/findings/route.ts`
  - Evidence: New endpoint, parses finding markdown files
  - Verification: ✅ Integration test reads findings from fixture

- [x] **T3.9**: Add `GET /api/projects/[projectId]/roadmap` — read and parse ROADMAP.md from external path; return RoadmapSprintEntry[]
  - Files: `app/api/projects/[projectId]/roadmap/route.ts`
  - Evidence: New endpoint, parses ROADMAP.md
  - Verification: ✅ Integration test reads roadmap from fixture

### Phase 4 — Workspace Init Update

**Objective**: Update workspace initialization to create `projects.json` and remove `projects/` directory creation.

**Tasks**:

- [x] **T4.1**: Update `POST /api/workspace/init` — create empty `projects.json` in `.kyro/`; remove `projects/` directory creation
  - Files: `app/api/workspace/init/route.ts`
  - Evidence: Creates `.kyro/projects.json` with `{ "version": 1, "projects": [] }`
  - Verification: ✅ Integration test confirms workspace init works

- [x] **T4.2**: Simplify `syncWorkspaceAgentDocs()` — read project list from registry instead of scanning `projects/` directory; or deprecate entirely
  - Files: `lib/file-format/templates.ts`
  - Evidence: Reads from registry via `listProjects(registryPath)`
  - Verification: ✅ No longer depends on `$WORKSPACE/projects/` directory

- [x] **T4.3**: Update `syncProjectReentryPrompts()` — skip writing to external dirs (sprint-forge already manages its own re-entry prompts); or remove entirely
  - Files: `lib/file-format/templates.ts`
  - Evidence: Now a no-op stub with documentation comment
  - Verification: ✅ No write attempts to external directories

- [x] **T4.4**: Update `resolveSprintFilePath()` and `buildCanonicalSprintFileName()` — resolve from registry project root instead of `$WORKSPACE/projects/{id}/sprints/`
  - Files: `lib/api/sprint-files.ts`
  - Evidence: Uses `resolveProjectRoot()` and `resolveProjectPath()`
  - Verification: ✅ Sprint file resolution works with external project paths

### Phase 5 — Integration Tests

**Objective**: Test full API flow with external sprint-forge directories using realistic fixtures.

**Tasks**:

- [x] **T5.1**: Create test fixture: a minimal sprint-forge directory structure under `lib/file-format/__tests__/fixtures/sprint-forge-project/` with README.md, ROADMAP.md, findings/, sprints/
  - Files: `lib/file-format/__tests__/fixtures/sprint-forge-project/`
  - Evidence: Directory with README.md, ROADMAP.md, findings/01-*.md, sprints/SPRINT-1-*.md
  - Verification: ✅ Matches sprint-forge output format

- [x] **T5.2**: Write unit tests for `registry.ts` — parseProjectRegistry, serializeProjectRegistry, validateSprintForgeDirectory, addProject, removeProject, listProjects
  - Files: `lib/file-format/__tests__/registry.test.ts`
  - Evidence: 14 tests covering all registry operations
  - Verification: ✅ All pass

- [x] **T5.3**: Write unit tests for `resolveProjectPath()` and `resolveProjectRoot()` — path resolution with per-project roots, traversal prevention
  - Files: `lib/api/__tests__/workspace-guard.test.ts`
  - Evidence: 4 new tests added to existing file (10 total)
  - Verification: ✅ All pass

- [x] **T5.4**: Write integration tests for refactored API routes — register project → list projects → list sprints → get findings → get roadmap
  - Files: `lib/services/file/__tests__/projects.file.integration.test.ts`
  - Evidence: 8 tests: register, list, sprints, findings, roadmap, update metadata, delete, invalid/duplicate rejection
  - Verification: ✅ Full flow works with external sprint-forge directory fixture

---

## Emergent Phases

### Emergent Phase — API Test Router Update

**Objective**: Update the mock API test router to support new findings and roadmap route modules.

**Tasks**:

- [x] **TE.1**: Add `FindingsRoute` and `RoadmapRoute` imports and route matching patterns to `api-test-router.ts`
  - Files: `lib/services/file/__tests__/api-test-router.ts`
  - Evidence: Added imports and regex patterns for `/api/projects/[projectId]/findings` and `/api/projects/[projectId]/roadmap`
  - Verification: ✅ Integration tests for findings and roadmap endpoints pass

---

## Findings Consolidation

| # | Finding | Origin Phase | Impact | Action Taken |
|---|---------|-------------|--------|-------------|
| 1 | API response wrapper uses `{ data: { ... } }` not direct `{ ... }` — integration tests must unwrap | Phase 5 | Medium — test correctness | Fixed response unwrapping in all integration test assertions |
| 2 | `FileProjectsService.createProject()` still sends old `{id, name}` format — service layer not yet updated for registry model | Phase 5 | High — service layer broken for registry model | Deferred to Sprint 3 (service layer refactor) |
| 3 | `CreateProjectInput` in `lib/services/types.ts` has `{id, name}` not `{path}` — needs registry-model update | Phase 5 | High — interface mismatch | Deferred to Sprint 3 |

---

## Accumulated Technical Debt

| # | Item | Origin | Sprint Target | Status | Resolved In |
|---|------|--------|--------------|--------|-------------|
| D1 | Logo "Clever" hardcoded in sidebar | Pre-existing | product decision | open | — |
| D2 | Service factory always returns mock — switching logic pending | Pre-existing | Sprint 3 | carry-over | — |
| D3 | Loading UI only in ContentRouter — sub-entities have no per-fetch states | Pre-existing | Sprint 4 | open | — |
| D4 | `parseSprintForgeFile()` recommendations section uses heuristic matching for heading | Sprint 1 Phase 3 | Sprint 3 | open | — |
| D5 | `FileProjectsService` and `CreateProjectInput` still use old `{id, name}` model — must be updated for registry `{path}` API | Sprint 2 Phase 5 | Sprint 3 | open | — |
| D6 | `addProject` in registry.ts throws unhandled error for duplicates — API route should catch and return 409 | Sprint 2 Phase 5 | Sprint 3 | open | — |

**Status values**: `open` | `in-progress` | `resolved` | `deferred` | `carry-over`

**Rules**:
- Never delete a row — only change status
- New items are appended at the bottom
- Inherited items keep their original numbers
- When resolved, fill "Resolved In" with the sprint number

---

## Definition of Done

- [x] `ProjectRegistryEntrySchema` and `ProjectRegistrySchema` added to `lib/types.ts`
- [x] `registry.ts` created with parse, serialize, validate, and CRUD functions
- [x] `resolveProjectPath()` and `resolveProjectRoot()` support per-project external roots
- [x] `GET /api/projects` reads from `projects.json` registry
- [x] `POST /api/projects` registers external directory path (no mkdir)
- [x] `GET /api/projects/[projectId]/sprints` reads from external directory
- [x] `GET /api/projects/[projectId]/findings` endpoint created
- [x] `GET /api/projects/[projectId]/roadmap` endpoint created
- [x] `DELETE /api/projects/[projectId]` removes from registry only (never deletes external dir)
- [x] Workspace init creates `projects.json` (no `projects/` directory)
- [x] `syncWorkspaceAgentDocs` and `syncProjectReentryPrompts` updated for registry model
- [x] Sprint file resolution works with external project paths
- [x] All unit tests pass (`vitest run`) — 100 tests, 13 files
- [x] No regressions in existing tests
- [x] All emergent phase tasks completed (1 emergent task)
- [x] Accumulated debt table updated
- [x] Retro section filled
- [x] Recommendations for Sprint 3 documented
- [x] Re-entry prompts updated

---

## Retro

### What Went Well

- Clean separation: API routes now fully decoupled from internal directory assumptions
- Registry model is simple and robust — plain JSON file with CRUD helpers
- Integration tests cover the full register → list → read → update → delete flow
- Sprint 1 parsers (auto-detection, sprint-forge format) worked seamlessly with the new external directory model
- `resolveProjectPath()` reuses the same traversal protection pattern, zero duplication

### What Didn't Go Well

- Integration tests initially failed because `ok()` wraps in `{ data: ... }` — tests assumed direct unwrapping
- Service layer (`FileProjectsService`, `CreateProjectInput`) still uses old model — couldn't update without scope creep into Sprint 3

### Surprises / Unexpected Findings

- The API test router needed updating to support new findings/roadmap routes (emergent task)
- `addProject` throws a plain Error for duplicates rather than returning a structured error — the API route doesn't catch it cleanly (logged as D6)

### New Technical Debt Detected

- D5: `FileProjectsService` and `CreateProjectInput` still use old `{id, name}` model
- D6: `addProject` duplicate error handling should return 409 from API route

---

## Recommendations for Sprint 3

1. Update `CreateProjectInput` to use `{ path: string; name?: string; color?: string }` matching the new POST /api/projects contract
2. Refactor `FileProjectsService.createProject()` to send `{path}` instead of `{id, name}` — align with registry model
3. Update service factory (`lib/services/index.ts`) to switch between mock and file services based on `NEXT_PUBLIC_USE_MOCK_DATA` (resolve D2)
4. Add proper error handling in `addProject` — return structured `WorkspaceError` with code `DUPLICATE_PROJECT` so API route can return 409 (resolve D6)
5. Update mock service's `createProject` to match the new interface for consistency
