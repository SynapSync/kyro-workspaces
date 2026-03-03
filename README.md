# Kyro

**Knowledge → Yield → Run → Optimize**

Kyro is an agentic execution kernel for structured work.

A self-optimizing system where AI agents and humans collaborate through
markdown files inside a shared workspace.

The workspace is the primary source of truth.\
The database is only a persistence layer.

Structure does not begin with manually created tasks.\
It emerges from knowledge.

---

## The Kyro Cycle

    Knowledge (docs)
        → Yield structure (tasks)
            → Run execution (sprints)
                → Optimize (agents adapt)

Kyro continuously executes this pipeline.

Agents:

- Read workspace files
- Extract actionable structure from documentation
- Generate tasks and sprint candidates
- Coordinate execution
- Optimize based on outcomes and activity

Work in Kyro is not manually managed first.\
It is derived, executed, and refined.

---

## Features

- **Multi-Project Management** --- Create and switch between multiple
  projects
- **Kanban Board** --- Drag-and-drop task management with columns
  (Backlog, Todo, In Progress, Review, Done)
- **Collapsible Columns** --- Focus-driven board experience
- **Sprints** --- Plan and track sprints with objectives and status
- **Sprint Sections** --- Markdown-based sections for:
  - Retrospective
  - Technical Debt tracking
  - Execution Metrics
  - Findings
  - Recommendations
- **Documents** --- Create and manage project documentation
- **Project README** --- Editable README per project
- **Workspace Bootstrap for Agents** --- `README.md` + `AGENTS.md` generated at workspace init
- **Project Agent Templates** --- New projects get `README.md`, `ROADMAP.md`, `RE-ENTRY-PROMPTS.md`
- **Agent Context Panel** --- Topbar shows active project, active sprint, and last active agent
- **Workspace Onboarding UI** --- Guided setup when workspace is missing or not initialized
- **Agents Activity** --- Track AI agent activities within projects
- **Dark/Light Theme** --- Full theme support with system preference
  detection
- **File-Based Storage** --- All data lives in markdown/JSON files
  (optional, toggle via `NEXT_PUBLIC_USE_MOCK_DATA`)

---

## Architecture

Kyro separates **execution model**, **data**, and **UI**:

    ┌─────────────────────────────────────────────────────────────┐
    │                        UI (React)                           │
    │  Components read from Zustand store → renders interface     │
    └─────────────────────────────────────────────────────────────┘
                                  ↕
    ┌─────────────────────────────────────────────────────────────┐
    │                   Service Layer                             │
    │  Mock (dev)  ←→  File-based (workspace)  ←→  API (future)  │
    └─────────────────────────────────────────────────────────────┘
                                  ↕
    ┌─────────────────────────────────────────────────────────────┐
    │                    Workspace (Files)                        │
    │  .kyro/config.json, projects/*/sprints/*.md, documents/     │
    └─────────────────────────────────────────────────────────────┘

### Design Principles

1.  File-first architecture\
2.  Structured markdown as operational input\
3.  Transparent agent activity\
4.  Reversible actions\
5.  Minimal friction\
6.  Extensible and hackable by design

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Components**: Radix UI primitives
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Drag & Drop**: @dnd-kit
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React
- **File Format**: gray-matter (YAML frontmatter)

---

## Getting Started

```bash
# Install dependencies
pnpm install

# Run development server (uses mock data by default)
pnpm dev

# Or run with file-based workspace
# 1. Set environment variables in .env.local:
#    NEXT_PUBLIC_USE_MOCK_DATA=false
#    KYRO_WORKSPACE_PATH=/path/to/workspace
# 2. Open Kyro and initialize workspace from onboarding UI

# Build for production
pnpm build

# Start production server
pnpm start

# Lint
pnpm lint
```

---

## Workspace Structure

    {KYRO_WORKSPACE_PATH}/
    ├── README.md             # Workspace index + agent protocol
    ├── AGENTS.md             # Workspace-wide agent execution rules
    ├── .kyro/
    │   ├── config.json          # Workspace metadata
    │   ├── members.json         # Team members
    │   └── activities.json      # Agent activity log
    └── projects/
        └── {project-slug}/
            ├── README.md         # Project overview
            ├── ROADMAP.md        # Sprint roadmap
            ├── RE-ENTRY-PROMPTS.md  # Session recovery prompts
            ├── sprints/
            │   └── SPRINT-NN.md  # Sprint with tasks (markdown checkboxes)
            └── documents/
                └── {doc}.md     # Project documentation

---

## Agent Workflow

When an agent receives _\"work on project X, sprint Y\"_, use this read order:

1. `projects/{slug}/README.md`
2. `projects/{slug}/ROADMAP.md`
3. latest sprint in `projects/{slug}/sprints/`
4. `projects/{slug}/RE-ENTRY-PROMPTS.md`

Task state symbols in sprint files:

- `[ ]` pending
- `[~]` in progress
- `[x]` done
- `[!]` blocked
- `[>]` carry-over

Activities are persisted in `.kyro/activities.json` and surfaced in the UI.
Kyro retains only the latest 200 activity entries to keep workspace files
bounded and fast for long-running projects.

`recordActivity` is non-blocking by design. If persistence fails, Kyro keeps the
main user flow running and surfaces an in-app warning (`Activity log warning`)
for local debugging.

`/api/activities` enforces payload boundaries for `projectId`, `description`,
and metadata key/value lengths to prevent oversized activity records.

---

## Project Structure

    kyro/
    ├── app/                    # Next.js App Router pages
    │   ├── api/                # API routes (file I/O bridge)
    │   ├── layout.tsx          # Root layout
    │   ├── page.tsx            # Main app page
    │   └── globals.css         # Global styles
    ├── components/
    │   ├── ui/                 # Reusable UI components
    │   ├── pages/              # Page components
    │   ├── kanban/             # Kanban board components
    │   └── app-sidebar.tsx     # Main sidebar
    ├── hooks/                  # Custom React hooks
    ├── lib/
    │   ├── api/                # API helpers, validation, error handling
    │   ├── file-format/        # Markdown parsers & serializers
    │   ├── services/           # Service layer (mock + file implementations)
    │   ├── types.ts            # TypeScript types & Zod schemas
    │   ├── store.ts            # Zustand store
    │   ├── config.ts           # UI constants
    │   └── utils.ts            # Utility functions
    └── public/                 # Static assets

---

## Scripts

Command Description

---

`pnpm dev` Start development server
`pnpm build` Build for production
`pnpm start` Start production server
`pnpm lint` Run ESLint
`pnpm test` Run unit tests
`pnpm run test:e2e:list` List Playwright E2E tests
`pnpm run test:e2e` Run Playwright E2E suite

For clean local E2E runs, Kyro uses `http://127.0.0.1:4173` in Playwright and
sets `allowedDevOrigins` in Next.js config to avoid cross-origin dev warnings.

---

## License

MIT
