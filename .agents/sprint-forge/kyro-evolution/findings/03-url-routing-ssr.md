---
title: "Finding: URL Routing and Server-Side Rendering"
created: 2026-03-07
severity: high
agents:
  - claude-opus-4-6
---

# Finding: URL Routing and Server-Side Rendering

## Summary

All navigation is client-side via Zustand state. There are no shareable URLs, no deep linking, and no server-side rendering. Every view is dispatched by `ContentRouter` reading store values (`activeSprintId`, `activeSidebarItem`, etc.) instead of URL parameters.

## Severity / Impact

**high** — Without URL routing, users cannot share links to specific views, browser back/forward doesn't work, and bookmarking is impossible. This is a foundational gap for a professional tool.

## Details

### Current navigation model

```typescript
// content-router.tsx dispatches views from Zustand state:
if (activeSprintDetailId) -> <SprintDetailPage />
if (activeSprintId)       -> <SprintBoard />
else                      -> PAGE_MAP[activeSidebarItem]
```

Sidebar clicks call `setActiveSidebarItem()` and `setActiveSprintId()` — these update Zustand state persisted to sessionStorage, but produce no URL change.

### Target URL schema

```
/                                          -> workspace overview
/projects/[id]                             -> project overview
/projects/[id]/sprints                     -> sprint list
/projects/[id]/sprints/[sprintId]          -> sprint detail
/projects/[id]/sprints/[sprintId]/board    -> kanban board
/projects/[id]/findings                    -> findings list
/projects/[id]/findings/[findingId]        -> finding detail
/projects/[id]/roadmap                     -> roadmap view
/projects/[id]/debt                        -> debt dashboard
/projects/[id]/documents                   -> documents list
```

### Migration scope

This is a large migration that touches most of the application:
- App Router pages for each route (Server Components where possible)
- Data fetching moves from client-side `useEffect` to server-side `fetch`
- `ContentRouter` is replaced or rewritten to read URL params
- Sidebar links become `<Link href={...}>` instead of store setters
- Breadcrumbs reflect URL hierarchy
- Cmd+K uses `router.push()` instead of store setters
- Zustand retains only UI state (sidebar collapsed, modals, command palette)

### Partial work done

Commit `c90fb0c` partially migrated to Next.js App Router structure, but navigation still runs through Zustand.

## Affected Files

- `app/` — new route folders for each URL
- `components/content-router.tsx` — rewrite or eliminate
- `components/app-sidebar.tsx` — links instead of store setters
- `components/app-topbar.tsx` — breadcrumbs from URL
- `components/command-palette.tsx` — `router.push()` for navigation
- `lib/store.ts` — remove navigation state, keep UI state

## Recommendations

1. Define URL schema and create App Router page files
2. Migrate data fetching to server-side where possible
3. Replace `ContentRouter` dispatch with URL-based routing
4. Update sidebar to use `<Link>` components
5. Update breadcrumbs to derive from URL hierarchy
6. Update Cmd+K to use `router.push()`
7. Strip navigation state from Zustand (keep UI state only)
8. Do incrementally: main routes first, secondary routes after
