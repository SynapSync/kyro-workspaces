# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Setup & Commands

**Package manager**: pnpm (lockfile v9). **Runtime**: Node 22+, TypeScript 5.7.3, Next.js 16, React 19.

```bash
pnpm install              # Install dependencies
pnpm dev                  # Dev server at localhost:3000
pnpm build                # Production build
pnpm start                # Start production server
pnpm lint                 # ESLint (Next.js defaults)
pnpm test                 # Vitest — unit tests (lib/**/*.test.ts)
pnpm test:watch           # Vitest in watch mode
pnpm test:e2e             # Playwright E2E (auto-starts dev server on :4173)
```

### Agent Rule: Build Execution

- Do **not** run `pnpm build` automatically after completing code changes.
- Run `pnpm build` only when the user explicitly requests a build.

Run a single test:
```bash
pnpm vitest run lib/file-format/__tests__/registry.test.ts
pnpm test:e2e tests/e2e/navigation.spec.ts
```

### Environment Variables

Create `.env.local` from `.env.example`:

| Variable | Purpose | Default |
|----------|---------|---------|
| `NEXT_PUBLIC_USE_MOCK_DATA` | `true` = mock services, `false` = filesystem mode | `true` |
| `NEXT_PUBLIC_MOCK_DELAY_MS` | Artificial latency (ms) for mock services | `0` |
| `NEXT_PUBLIC_API_URL` | Backend API base URL (unused — no backend yet) | empty |
| `KYRO_WORKSPACE_PATH` | Root directory for workspace files | `~/kyro-workspace` |
| `KYRO_ACTIVITIES_RETENTION_MAX_ENTRIES` | Max activity log entries (1–5000) | `200` |

### Workspace Setup (file mode)

When `NEXT_PUBLIC_USE_MOCK_DATA=false`, Kyro reads from the filesystem. Initialize via the API or UI:

```
$KYRO_WORKSPACE_PATH/
├── .kyro/
│   ├── config.json          # Workspace metadata
│   ├── projects.json        # Registry of external project paths
│   ├── members.json         # Team roster
│   └── activities.json      # Agent activity log
```

Projects are external sprint-forge directories registered in the registry:
```
/path/to/sprint-forge-dir/
├── README.md               # Project entry point
├── ROADMAP.md              # Sprint plan
├── sprints/
│   ├── SPRINT-01.md        # Sprint-forge format
│   └── SPRINT-02.md
├── findings/
│   └── 01-finding-name.md
└── documents/
    └── architecture.md
```

---

## Architecture

Kyro is a **viewer + cockpit** for sprint-forge project directories. It renders sprint data (kanban, findings, roadmaps, debt tracking) from markdown files and supports task mutations via AST-based writes. API routes read/write the filesystem; UI state lives in Zustand.

### Data Flow

```
Filesystem (sprint-forge dirs)
  → lib/file-format/ parses markdown into typed structures
  → lib/index/ (SQLite) derived index for instant queries + FTS5 search
  → API routes (app/api/) read/write markdown files
  → lib/file-format/ast-writer.ts writes via AST manipulation
  → lib/services/ (file/ or mock/) provides data to the store
  → lib/store.ts (Zustand) holds client state + UI preferences
  → components/pages/ render views via App Router

SQLite Index (lib/index/):
  Startup → initIndex() scans all projects, parses markdown, populates SQLite
  File change → file-watcher detects → reindexFile() updates SQLite → SSE push
  Search → /api/search queries FTS5 → results to command palette
  Markdown remains source of truth — SQLite rebuilds from files if deleted
```

### App Layout

```
app/layout.tsx (root)
  └── app/(workspace)/layout.tsx — WorkspaceShell
      ┌──────────┬───────────────────────────┐
      │ AppSidebar│ <div flex-1 flex-col>     │
      │ (w-64 or │  ┌─────────────────────┐  │
      │  w-16)   │  │ AppTopbar (h-14)    │  │
      │          │  ├─────────────────────┤  │
      │          │  │ <main flex-1>       │  │
      │          │  │   {children}        │  │
      │          │  │   (App Router page) │  │
      │          │  └─────────────────────┘  │
      └──────────┴───────────────────────────┘
```

### URL Routing (App Router)

Navigation uses Next.js App Router with URL-based routing. All navigation state comes from the URL — Zustand holds only data and UI preferences.

**Route structure**:

```
/                                              → WorkspaceRoot (→ first project or onboarding)
/(workspace)/                                  → WorkspaceRoot (→ first project)
/(workspace)/[projectId]/                      → ProjectLayout (syncs URL → store)
/(workspace)/[projectId]/overview              → ProjectOverviewPage
/(workspace)/[projectId]/readme                → ReadmePage
/(workspace)/[projectId]/sprints               → SprintsPage
/(workspace)/[projectId]/sprints/[sprintId]    → SprintBoardPage (kanban)
/(workspace)/[projectId]/sprints/[sprintId]/detail → SprintDetailPage
/(workspace)/[projectId]/findings              → FindingsPage
/(workspace)/[projectId]/roadmap               → RoadmapPage
/(workspace)/[projectId]/debt                  → DebtDashboardPage
/(workspace)/[projectId]/documents             → DocumentsPage
/(workspace)/[projectId]/agents                → AgentsActivityPage
/(workspace)/[projectId]/reentry               → ReentryPromptsPage
```

**Layout hierarchy**:

- `app/layout.tsx` — Root: wraps with `<Providers>` (Zustand, React Query)
- `app/(workspace)/layout.tsx` — `WorkspaceShell`: renders `AppSidebar` + `AppTopbar` + `CommandPalette` + `{children}`; shows `WorkspaceOnboarding` if no projects
- `app/(workspace)/[projectId]/layout.tsx` — `ProjectLayout`: validates `projectId` from URL params, syncs `store.activeProjectId`

**Navigation patterns**:

- Sidebar uses `<Link href={...}>` from `next/link`
- Command palette uses `router.push()` from `next/navigation`
- Breadcrumbs in `AppTopbar` derived from URL pathname + project/sprint data from store
- Active nav item derived from URL pathname segment (not store state)

### API Routes

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/workspace` | GET | Workspace name from `.kyro/config.json` |
| `/api/workspace/init` | POST | Initialize workspace directory |
| `/api/projects` | GET, POST | List projects (with embedded sprints) / register new |
| `/api/projects/[id]` | GET, PUT, DELETE | Single project CRUD |
| `/api/projects/[id]/findings` | GET | Parsed findings from `findings/` dir |
| `/api/projects/[id]/roadmap` | GET | Parsed ROADMAP.md |
| `/api/members` | GET, POST | Team members |
| `/api/activities` | GET, POST | Activity log |
| `/api/search` | GET | Full-text search via SQLite FTS5 (`?q=query&type=task&project=id`) |
| `/api/events` | GET (SSE) | Server-Sent Events for real-time index updates |

Routes use `getWorkspacePath()` + `resolveAndGuard()` (prevents directory traversal) + `handleError()` for consistent error responses.

### Service Layer

`lib/services/index.ts` — factory returns mock or file services based on `NEXT_PUBLIC_USE_MOCK_DATA`:

| Interface | Mock (dev) | File (production) |
|-----------|------------|-------------------|
| `ProjectsService` | In-memory from `lib/mock-data.ts` | Calls API routes → filesystem |
| `MembersService` | In-memory | `.kyro/members.json` |
| `ActivitiesService` | In-memory | `.kyro/activities.json` |

Components consume via `import { services } from "@/lib/services"` — never import mock/file directly.

---

## State Management (Zustand)

**Store**: `lib/store.ts` — Zustand 5.0.2 with `persist` middleware (sessionStorage, key: `"kyro-ui-state"`).

### Key State Slices

| Slice | State | Purpose |
|-------|-------|---------|
| **Projects** | `projects`, `activeProjectId` | Multi-project management |
| **Findings** | `findings[projectId]`, `findingsLoading` | Per-project lazy loading |
| **Roadmaps** | `roadmaps[projectId]`, `roadmapLoading` | Per-project lazy loading |
| **Re-entry Prompts** | `reentryPrompts[projectId]` | Per-project lazy loading |
| **Members** | `members[]` | Team roster |
| **Activities** | `activities[]`, `activitiesDiagnostics` | Audit log with diagnostics |
| **Task Mutations** | `updatingTasks[taskId]` | Per-task loading indicators |
| **UI** | `sidebarCollapsed`, `focusMode`, `zenMode`, `commandPaletteOpen`, `addProjectDialogOpen` | Display preferences |
| **Columns** | `collapsedColumns[sprintId-columnId]` | Per-sprint kanban column collapse |
| **Async** | `isInitializing`, `initError`, `isSaving`, `saveError` | Loading/error states |

### Persisted to sessionStorage

`activeProjectId`, `sidebarCollapsed`

**Note**: No navigation state is persisted — all navigation is URL-based via App Router.

### Project Interactions

- **Project switch** (`setActiveProjectId`): used by `ProjectLayout` to sync URL → store
- **Lazy loading** (`loadFindings`, `loadRoadmap`, `loadReentryPrompts`): fetched on demand per project

### Error Patterns

- **Optimistic updates**: `updateProject`/`deleteProject` update state immediately, rollback on error
- **Best-effort logging**: `addActivity` prepends locally, persists async — failure shows warning, doesn't block UI
- **Startup failures**: stored in `initError`, app shows onboarding/error UI

---

## Modules & Project Structure

```
instrumentation.ts              # Next.js instrumentation hook — initializes SQLite index on startup

app/
├── layout.tsx              # Root: HTML shell + metadata
├── globals.css             # Tailwind v4 entry (theme, plugins, base)
├── (workspace)/            # Workspace route group
│   ├── layout.tsx          # WorkspaceShell: sidebar + topbar + command palette
│   ├── page.tsx            # WorkspaceRoot redirect
│   └── [projectId]/        # Project routes
│       ├── layout.tsx      # ProjectLayout: URL→store sync
│       ├── page.tsx        # Redirect to /overview
│       ├── overview/       # ProjectOverviewPage
│       ├── sprints/        # SprintsPage, [sprintId]/ (board + detail)
│       ├── findings/       # FindingsPage
│       ├── roadmap/        # RoadmapPage
│       ├── debt/           # DebtDashboardPage
│       ├── documents/      # DocumentsPage
│       ├── agents/         # AgentsActivityPage
│       ├── readme/         # ReadmePage
│       └── reentry/        # ReentryPromptsPage
└── api/                    # Server-side API routes

lib/
├── types.ts                # Zod schemas + TypeScript types ONLY (no constants)
├── config.ts               # ALL UI constants (nav items, columns, colors, section metadata)
├── auth.ts                 # Mock currentUser (placeholder for real auth)
├── store.ts                # Zustand store (client state + persistence)
├── utils.ts                # cn() utility for Tailwind class merging
├── markdown.ts             # Text formatting helpers (word count, reading time, heading extraction)
├── mock-data.ts            # Seed data — ONLY imported by lib/services/mock/
├── file-format/            # Pure parsers & serializers for sprint-forge markdown
│   ├── parsers.ts          # Project README, documents, basic sprints
│   ├── sprint-forge-parsers.ts  # Rich sprint-forge: phases, debt, findings, disposition
│   ├── markdown-utils.ts   # Section extraction, table parsing, blockquote metadata
│   ├── serializers.ts      # Domain entities → markdown/JSON
│   ├── registry.ts         # Project registry CRUD (.kyro/projects.json)
│   └── templates.ts        # Default workspace/project README templates
├── index/                  # SQLite derived index (ephemeral — rebuilds from markdown)
│   ├── sqlite.ts           # Database singleton, schema, FTS5 virtual tables
│   ├── builder.ts          # initIndex(), reindexFile(), reindexProject()
│   ├── queries.ts          # Typed query wrappers + FTS5 searchIndex()
│   ├── file-watcher.ts     # fs.watch() with debounce → reindex → SSE push
│   ├── startup.ts          # ensureIndex() — lazy init with graceful degradation
│   └── index.ts            # Barrel exports
├── api/                    # API route helpers
│   ├── errors.ts           # WorkspaceError class with codes → HTTP status mapping
│   ├── response-helpers.ts # ok(), notFound(), handleError(), validateBody()
│   ├── workspace-guard.ts  # Path resolution + directory traversal prevention
│   ├── load-sprints.ts     # Scan sprints/ dir → parsed Sprint[]
│   ├── client.ts           # apiFetch<T>() for client-side API calls
│   ├── types.ts            # DTOs (snake_case for backend contract)
│   └── mappers/            # DTO → domain type transformations
└── services/               # Service layer abstraction
    ├── types.ts            # Service interfaces (ProjectsService, MembersService, etc.)
    ├── index.ts            # Factory: mock or file based on env
    ├── mock/               # In-memory implementations
    └── file/               # Filesystem implementations (calls API routes)

components/
├── ui/                     # shadcn/ui primitives (~18 components)
├── pages/                  # Full-page views (one per route)
├── sprint/                 # Sprint-forge structured renderers (tables, checklists, phases)
├── kanban/                 # Kanban board (dnd-kit drag-drop)
├── dialogs/                # Modal dialogs
├── markdown-renderer.tsx   # Full markdown pipeline (GFM + highlight + sanitize)
├── inline-markdown.tsx     # Lightweight inline-only markdown (no block elements)
├── app-sidebar.tsx         # Navigation sidebar (collapsible, ⌘B), uses <Link>
├── app-topbar.tsx          # Breadcrumb from URL + project/sprint context
├── command-palette.tsx     # ⌘K command palette, uses router.push()
├── providers.tsx           # QueryClient + AppInitializer
└── workspace-onboarding.tsx # First-run setup flow

hooks/
├── use-mobile.ts           # Mobile breakpoint detection
├── use-realtime-sync.ts    # SSE subscription for real-time index updates
└── use-toast.ts            # Toast notifications (wraps sonner)
```

### Module Boundaries

1. **types.ts** has only schemas/types — config.ts has all UI constants (prevents circular imports)
2. **mock-data.ts** only imported by `services/mock/` — never by components
3. **file-format/ parsers are pure** — no side effects, used by both API routes and services
4. **API layer (fs/path) only in server routes** — never in components
5. **Services abstract implementation** — components use `services` interface, never mock/file directly
6. **All markdown through renderers** — `MarkdownRenderer` for blocks, `InlineMarkdown` for inline

---

## Design System & UI

### Tailwind CSS v4

- **Entry**: `app/globals.css` — uses `@import 'tailwindcss'` and `@plugin '@tailwindcss/typography'`
- **No `tailwind.config.js`** — theme defined via `@theme inline` in globals.css
- **Colors**: OKLch color space, CSS custom properties in `:root` and `.dark`
- **Dark mode**: `.dark` class with `@custom-variant dark (&:is(.dark *))`
- **Fonts**: Geist (sans), Geist Mono (code) via `next/font/google`
- **Animations**: `tw-animate-css` plugin

### Color Tokens

All colors are CSS variables: `--primary`, `--secondary`, `--accent`, `--muted`, `--destructive`, `--background`, `--foreground`, `--card`, `--border`, `--ring`, `--sidebar-*`, `--chart-1` through `--chart-5`.

Domain-specific colors live in `lib/config.ts`: `PRIORITY_CONFIG`, `SPRINT_TYPE_COLORS`, `FINDING_SEVERITY_COLORS` — all use `bg-{color}-500/10 text-{color}-600` pattern.

### Markdown Rendering

| Component | Use for | Plugins |
|-----------|---------|---------|
| `MarkdownRenderer` | Full content (pages, sprint sections, readme, docs) | remark-gfm, rehype-highlight, rehype-sanitize |
| `InlineMarkdown` | Table cells, task titles, list items, descriptions | remark-gfm only, all block elements → `<span>` |

Both are memo-wrapped for performance.

### Layout Scroll Pattern

Flex containers need `min-h-0` for ScrollArea to work:

```tsx
<div className="flex h-full min-h-0 flex-col">
  <div className="shrink-0">Header</div>
  <div className="flex-1 min-h-0 overflow-hidden">
    <ScrollArea className="flex-1 min-h-0">
      {/* scrollable content */}
    </ScrollArea>
  </div>
</div>
```

Page components use `overflow-hidden` for pages with own scroll (sprint detail/board), `overflow-auto` for others.

### Icon System

All icons from `lucide-react` as named imports. Config maps icons via `LucideIcon` type. Render pattern: `const Icon = item.icon; <Icon className="h-4 w-4" />`

---

## Testing

### Unit Tests (Vitest)

- **Config**: `vitest.config.ts` — Node environment, globals enabled, `@/` alias
- **Pattern**: `lib/**/__tests__/*.test.ts`
- **Coverage**: `@vitest/coverage-v8` installed, run with `pnpm test -- --coverage`

```bash
pnpm test                                            # All unit tests
pnpm vitest run lib/file-format/__tests__/sprint.test.ts  # Single file
pnpm test -- --grep "parseSprintFile"                # Pattern match
```

### E2E Tests (Playwright)

- **Config**: `playwright.config.ts` — Chromium only, headless, 1440×900 viewport
- **Web server**: Auto-starts Next.js on port 4173
- **Pattern**: `tests/e2e/*.spec.ts` with shared `helpers.ts` (API mocking via `page.route()`)

```bash
pnpm test:e2e                                  # All E2E tests
pnpm test:e2e tests/e2e/navigation.spec.ts     # Single file
pnpm test:e2e --ui                             # Interactive browser mode
```

### Known Gap

No React component testing (jsdom + @testing-library/react). Unit tests cover pure functions only; UI interactions are covered by E2E tests.

---

## Conventions

### File Naming & Exports

- All files: `kebab-case.ts` / `kebab-case.tsx`
- All components: **named exports only** (no default exports)
- All client components with hooks/state: `"use client"` directive at top
- All imports use `@/` path alias

### Adding a New Page

1. Create `components/pages/my-page.tsx` with named export (`"use client"`)
2. Create `app/(workspace)/[projectId]/my-section/page.tsx` that renders the component
3. Add nav item to `NAV_ITEMS` in `lib/config.ts` (with Lucide icon and `href: "/my-section"`)

### API Route Pattern

```typescript
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const workspacePath = getWorkspacePath();
    // ... logic using resolveAndGuard(), lib/file-format parsers
    return ok({ data }, 200);
  } catch (err) {
    return handleError(err);  // WorkspaceError → HTTP status automatically
  }
}
```

### Write Capabilities

Task status updates and sprint mutations are handled via AST-based writes (`lib/file-format/ast-writer.ts`). The UI supports:
- Task status changes via kanban drag-drop (with confirmation dialog)
- Task creation/deletion via API routes
- Sprint status updates

All markdown writes use `unified` + `remark` AST manipulation — no regex-based writes. Workspace metadata (project registry, members, activities) is also writable.
