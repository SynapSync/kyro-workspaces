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

Kyro is a **read-only viewer** for sprint-forge project directories. It renders sprint data (kanban, findings, roadmaps, debt tracking) from markdown files. No backend — state is client-side via Zustand, API routes read directly from disk.

### Data Flow

```
Filesystem (sprint-forge dirs)
  → API routes (app/api/) read markdown files
    → lib/file-format/ parses markdown into typed structures
      → lib/api/load-sprints.ts embeds sprints in project responses
        → lib/services/ (file/ or mock/) provides data to the store
          → lib/store.ts (Zustand) holds all client state
            → components/ render the UI
```

### App Layout

```
app/page.tsx renders:
┌──────────────────────────────────────────────┐
│ <div className="flex h-screen">              │
│  ┌──────────┬───────────────────────────┐    │
│  │ AppSidebar│ <div flex-1 flex-col>     │    │
│  │ (w-64 or │  ┌─────────────────────┐  │    │
│  │  w-16)   │  │ AppTopbar (h-14)    │  │    │
│  │          │  ├─────────────────────┤  │    │
│  │          │  │ <main flex-1>       │  │    │
│  │          │  │   ContentRouter     │  │    │
│  │          │  │                     │  │    │
│  │          │  └─────────────────────┘  │    │
│  └──────────┴───────────────────────────┘    │
└──────────────────────────────────────────────┘
```

### Navigation (Client-Side Only)

**No URL routing** — all navigation is Zustand state. `ContentRouter` dispatches views:

```typescript
if (activeSprintDetailId) → <SprintDetailPage />
if (activeSprintId)       → <SprintBoard />       // kanban
else                      → PAGE_MAP[activeSidebarItem]
```

PAGE_MAP: `overview`, `readme`, `sprints`, `findings`, `roadmap`, `debt`, `documents`, `agents`

A breadcrumb in `AppTopbar` shows: `Project > Section > Sprint > Finding`

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

**Store**: `lib/store.ts` — Zustand 5.0.2 with `persist` middleware (sessionStorage, key: `"kyro-nav-state"`).

### Key State Slices

| Slice | State | Purpose |
|-------|-------|---------|
| **Projects** | `projects`, `activeProjectId` | Multi-project management |
| **Findings** | `findings[projectId]`, `activeFindingId` | Per-project lazy loading + drill-down |
| **Roadmaps** | `roadmaps[projectId]` | Per-project lazy loading |
| **Members** | `members[]` | Team roster |
| **Activities** | `activities[]`, `activityWriteWarning` | Audit log with error resilience |
| **Navigation** | `activeSidebarItem`, `activeSprintId`, `activeSprintDetailId` | View routing |
| **UI** | `sidebarCollapsed`, `focusMode`, `zenMode`, `commandPaletteOpen` | Display preferences |
| **Async** | `isInitializing`, `initError`, `isSaving`, `saveError` | Loading/error states |

### Persisted to sessionStorage

`activeProjectId`, `activeSidebarItem`, `activeSprintId`, `activeSprintDetailId`, `sidebarCollapsed`

### Navigation Interactions

- **Project switch** (`setActiveProjectId`): clears sprint IDs, resets sidebar to `"overview"`
- **Sprint selection** (`setActiveSprintId`): opens kanban board
- **Sprint detail** (`setActiveSprintDetailId`): opens structured section view (overrides sprint board)
- **Finding drill-down** (`setActiveFindingId`): independent of sprint nav

### Error Patterns

- **Optimistic updates**: `updateProject`/`deleteProject` update state immediately, rollback on error
- **Best-effort logging**: `addActivity` prepends locally, persists async — failure shows warning, doesn't block UI
- **Startup failures**: stored in `initError`, app shows onboarding/error UI

---

## Modules & Project Structure

```
app/
├── layout.tsx              # Root metadata + analytics
├── page.tsx                # Main entry: Providers + Sidebar + Topbar + ContentRouter
├── globals.css             # Tailwind v4 entry (theme, plugins, base)
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
├── ui/                     # shadcn/ui primitives (~59 components)
├── pages/                  # Full-page views (one per nav item)
├── sprint/                 # Sprint-forge structured renderers (tables, checklists, phases)
├── kanban/                 # Kanban board (dnd-kit drag-drop)
├── dialogs/                # Modal dialogs
├── markdown-renderer.tsx   # Full markdown pipeline (GFM + highlight + sanitize)
├── inline-markdown.tsx     # Lightweight inline-only markdown (no block elements)
├── content-router.tsx      # Main view dispatcher
├── app-sidebar.tsx         # Navigation sidebar (collapsible, ⌘B)
├── app-topbar.tsx          # Breadcrumb + search + agent context
├── command-palette.tsx     # ⌘K command palette
├── providers.tsx           # QueryClient + AppInitializer
└── workspace-onboarding.tsx # First-run setup flow

hooks/
├── use-mobile.ts           # Mobile breakpoint detection
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

`ContentRouter` uses `overflow-hidden` for pages with own scroll (sprint detail/board), `overflow-auto` for others.

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

1. Create `components/pages/my-page.tsx` with named export
2. Add entry to `PAGE_MAP` in `content-router.tsx`
3. Add nav item to `NAV_ITEMS` in `lib/config.ts` (with Lucide icon)

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

### Read-Only Principle

Sprint-forge files (sprints, tasks, findings, documents) are **never modified** by the UI. Only workspace metadata (project registry, members, activities) is writable.
