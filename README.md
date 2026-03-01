# Kyro

A modern project management application built with Next.js 16, React 19, and Radix UI. Manage projects, sprints, tasks, and documents with a beautiful, accessible interface.

## Features

- **Multi-Project Management** - Create and switch between multiple projects
- **Kanban Board** - Drag-and-drop task management with columns (Backlog, Todo, In Progress, Review, Done)
- **Sprints** - Plan and track sprints with objectives and status
- **Sprint Sections** - Markdown-based sections for:
  - Retrospective
  - Technical Debt tracking
  - Execution Metrics
  - Findings
  - Recommendations
- **Documents** - Create and manage project documentation
- **Project README** - Editable README per project
- **Agents Activity** - Track AI agent activities within projects
- **Dark/Light Theme** - Full theme support with system preference detection

## Tech Stack

- **Framework**: Next.js 16
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Components**: Radix UI primitives
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Drag & Drop**: @dnd-kit
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React

## Getting Started

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint
pnpm lint
```

## Project Structure

```
kyro/
├── app/                 # Next.js App Router pages
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Main app page
│   └── globals.css      # Global styles
├── components/
│   ├── ui/              # Reusable UI components
│   ├── pages/           # Page components
│   ├── kanban/          # Kanban board components
│   ├── app-sidebar.tsx  # Main sidebar
│   ├── app-topbar.tsx   # Top navigation bar
│   └── content-router.tsx
├── hooks/               # Custom React hooks
├── lib/
│   ├── types.ts         # TypeScript types & Zod schemas
│   ├── store.ts         # Zustand store
│   ├── utils.ts         # Utility functions
│   └── mock-data.ts     # Mock data for development
└── public/              # Static assets
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |

## License

MIT
