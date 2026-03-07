# Finding: Command Bar Structured Actions & Kanban Persistence

## Summary

Kyro is 100% read-only. The kanban drag-drop doesn't persist, no editing or creation is possible, and the command palette only navigates. However, speculative API routes for sprint CRUD, task CRUD, and document CRUD already exist in `app/api/` — they just have no UI. The product has "the brain" (parsers, types, structured data) but "no hands."

## Severity / Impact

**high** — This is the gap between "viewer" and "tool." Until Kyro can act on data, it's a passive dashboard. The unused API routes represent significant invested work that delivers zero user value until connected to a UI.

## Details

### Unused API Routes (code exists, no UI consumers)

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/projects/[id]/sprints/[sprintId]` | POST, PUT, DELETE | Sprint CRUD |
| `/api/projects/[id]/sprints/[sprintId]/tasks/[taskId]` | PUT, DELETE | Task CRUD |
| `/api/projects/[id]/documents` | POST | Document creation |
| `/api/projects/[id]/documents/[docId]` | PUT, DELETE | Document edit/delete |
| `/api/projects/[id]/documents/[docId]/versions` | GET, POST | Version history |
| `/api/projects/[id]/documents/[docId]/versions/restore` | POST | Version restore |

### Kanban Non-Persistence

The `SprintBoardPage` uses dnd-kit for drag-drop but state changes are:
- Visual only (local Zustand state update)
- Lost on page refresh
- Never written to filesystem

### Command Palette Limitation

The command palette is navigation-only. The "Actions" group has only "Add Project." There is no way to trigger data mutations from Cmd+K.

## Affected Files

- `components/command-palette.tsx` — Add structured action commands
- `components/kanban/sprint-board-page.tsx` — Wire drag-drop to task CRUD API
- `app/api/projects/[id]/sprints/[sprintId]/tasks/[taskId]/route.ts` — Existing, needs UI consumer
- `lib/store.ts` — Add mutation actions (updateTaskStatus, etc.)
- `lib/services/types.ts` — May need new service methods

## Recommendations

1. Wire kanban drag-drop to persist task status changes via `PUT /api/projects/[id]/sprints/[sprintId]/tasks/[taskId]`
2. Add an "Actions" section to Cmd+K with structured commands: "Update task status", "Create document"
3. Add confirmation dialogs before each write operation showing what will change
4. Log all mutations as agent activities for audit trail
5. Implement optimistic updates with rollback on API failure (pattern already exists in store for projects)
