# Finding: Live Search & Cross-Project Intelligence

## Summary

The search bar in the topbar and the command palette (Cmd+K) are both non-functional placeholders. A developer with multiple sprint-forge projects and dozens of sprints cannot find anything without manually clicking through pages. Kyro already parses all data into structured types — this structured data is an untapped search index.

## Severity / Impact

**high** — Search is the feature that makes the difference between "nice dashboard" and "tool I actually use daily." Without it, navigating a project with 5+ sprints and 30+ tasks requires dozens of clicks.

## Details

The current command palette (`components/command-palette.tsx`) uses `cmdk` (already installed) but only supports:
- Navigation commands: "Go to Overview", "Go to Sprints", etc.
- UI toggles: sidebar, focus mode, zen mode
- One action: "Add Project"

It cannot search actual content: tasks, findings, debt items, sprint sections, or documents.

Meanwhile, the Zustand store already holds fully parsed, typed data:
- `projects[].sprints[].tasks[]` — Task title, status, taskRef, files
- `findings[projectId][]` — Title, severity, affected files, summary
- `projects[].sprints[].debtItems[]` — Item, status, origin, sprint target
- `projects[].sprints[].sections` — Sprint objective, retro, recommendations
- `projects[].sprints[].phases[]` — Phase name, objective, tasks

All of this is already in memory. Building a search index is a matter of flattening and scoring — no new data fetching needed.

## Affected Files

- `components/command-palette.tsx` — Must be extended with search results
- `lib/store.ts` — Source of all searchable data
- `components/app-topbar.tsx` — Search input currently non-functional

## Recommendations

1. Build a search index function that flattens store data into searchable entries (type, title, description, metadata, navigation target)
2. Implement fuzzy matching using `cmdk`'s built-in scoring or a lightweight fuzzy lib
3. Add grouped result types to Cmd+K: Tasks, Findings, Debt, Sprints, Documents
4. Each result must navigate to the exact view (sprint detail → specific section, finding detail, etc.)
5. Replace the placeholder search input in topbar with Cmd+K trigger
