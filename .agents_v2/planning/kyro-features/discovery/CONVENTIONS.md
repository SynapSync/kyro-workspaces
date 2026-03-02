# CONVENTIONS.md - Kyro Project Conventions

## Project Overview

**Project Name:** Kyro (formerly Clever)  
**Type:** Web Application (Next.js 16 + React 19)  
**Purpose:** Project management tool with Kanban boards, sprints, and AI agent integration

---

## Technology Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16.1.6 |
| Language | TypeScript 5.7.3 |
| UI Library | React 19.2.4 |
| Styling | Tailwind CSS 4.2.0 |
| State Management | Zustand 5.0.2 |
| Drag & Drop | @dnd-kit/core 6.3.1 |
| Animations | Framer Motion 11.15.0 |
| Markdown | react-markdown 9.0.1 |
| UI Components | Radix UI primitives |
| Icons | Lucide React |
| Form Validation | React Hook Form + Zod |
| Toast Notifications | Sonner |

---

## Project Structure

```
kyro/
├── app/                    # Next.js app router pages
├── components/
│   ├── ui/                # Reusable UI components (Radix-based)
│   ├── kanban/            # Kanban board components
│   ├── pages/             # Page-level components
│   ├── app-sidebar.tsx    # Main sidebar navigation
│   ├── app-topbar.tsx     # Top navigation bar
│   └── content-router.tsx # Page routing logic
├── lib/
│   ├── store.ts           # Zustand store (single source of truth)
│   ├── types.ts           # Zod schemas + TypeScript types
│   ├── mock-data.ts       # Initial mock data
│   └── utils.ts           # Utility functions (cn, date formatting)
├── hooks/                 # Custom React hooks
├── public/               # Static assets
└── package.json
```

---

## UI Component Patterns

### Component Architecture

1. **UI Components** (`components/ui/*.tsx`)
   - Built on Radix UI primitives
   - Accept `className` for customization
   - Use `cva` (class-variance-authority) for variants
   - Export component + sub-components

2. **Page Components** (`components/pages/*.tsx`)
   - Handle business logic
   - Use Zustand store via `useAppStore()`
   - Pass data to presentational components

3. **Presentational Components** (`components/kanban/*.tsx`)
   - Pure rendering, no state logic
   - Accept data via props
   - Emit events via callbacks

### Styling Conventions

- **Tailwind CSS** for all styling
- **Design tokens** via CSS variables in `globals.css`
- **Color scheme:** Dark mode support via `next-themes`
- **Component variants:** `cva` for conditional classes

### Existing UI Components to Reuse

| Component | Location | Purpose |
|-----------|----------|---------|
| `Collapsible` | `components/ui/collapsible.tsx` | Collapsible panels (Radix-based) |
| `Button` | `components/ui/button.tsx` | Primary actions |
| `Badge` | `components/ui/badge.tsx` | Labels and status |
| `ScrollArea` | `components/ui/scroll-area.tsx` | Scrollable containers |
| `Dialog` | `components/ui/dialog.tsx` | Modal dialogs |
| `Tooltip` | `components/ui/tooltip.tsx` | Hover tooltips |
| `Kbd` | `components/ui/kbd.tsx` | Keyboard shortcut display |
| `Command` | `components/ui/command.tsx` | Command palette (cmdk) |

---

## State Management Patterns

### Zustand Store (`lib/store.ts`)

```typescript
interface AppState {
  // Data
  projects: Project[];
  activeProjectId: string;
  
  // UI State
  activeSidebarItem: string;
  activeSprintId: string | null;
  
  // Actions
  setActiveSidebarItem: (item: string) => void;
  // ... more actions
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  projects: mockProjects,
  
  // Action implementations
  setActiveSidebarItem: (item) => set({ activeSidebarItem: item }),
}));
```

### Store Usage Pattern

```typescript
const { projects, activeProjectId } = useAppStore();
const activeProject = projects.find(p => p.id === activeProjectId);
```

### Adding New State

1. Define type in `interface AppState`
2. Add initial value in store creation
3. Add action function
4. Export in `AppState` interface

---

## Type Definitions (`lib/types.ts`)

### Pattern

1. **Zod Schema** → Define validation rules
2. **TypeScript Type** → Infer from Zod using `z.infer`
3. **Static Config** → Array constants (e.g., `COLUMNS`)

### Example

```typescript
// Zod schema
export const TaskStatusSchema = z.enum(["backlog", "todo", "in_progress", "review", "done"]);

// TypeScript type
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

// Static config
export const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: "backlog", title: "Backlog", color: "bg-muted-foreground/60" },
  // ...
];
```

---

## Component Patterns

### BoardColumn (`components/kanban/board-column.tsx`)

- Renders column header with title and task count
- Renders task list via `SortableContext` (dnd-kit)
- Accepts: `id`, `title`, `color`, `tasks[]`, `onEditTask`, `onDeleteTask`

### TaskCard (`components/kanban/task-card.tsx`)

- Renders individual task with title, priority badge, assignee avatar
- Supports drag handle
- Accepts: `task`, `onEdit`, `onDelete`

### AppSidebar (`components/app-sidebar.tsx`)

- Fixed width: `w-64` (256px)
- Project switcher dropdown
- Navigation items with icons
- Collapsible sections

---

## Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Files | kebab-case | `sprint-board.tsx`, `task-card.tsx` |
| Components | PascalCase | `SprintBoard`, `BoardColumn` |
| Types | PascalCase | `TaskStatus`, `Sprint` |
| Store actions | camelCase | `setActiveSidebarItem` |
| CSS classes | Tailwind utilities | `flex items-center gap-2` |
| Zod schemas | Schema suffix | `TaskSchema`, `ProjectSchema` |

---

## Keyboard Shortcuts Pattern

- Use `@radix-ui/react-command` for command palette
- Display shortcuts with `<Kbd>` component
- Store shortcuts in constants for reuse

---

## Animation Patterns

- Use **Framer Motion** for complex animations
- Use **CSS transitions** for simple state changes
- Use **Radix UI** primitive animations where available

---

## Persistence

- Use **localStorage** for user preferences
- Store state structure: `{ key: string, value: any }`
- Example: Sidebar collapsed state

---

## Testing Patterns

- Unit tests for utility functions
- Component tests with React Testing Library
- Integration tests for store actions

---

## File Creation Checklist

When creating a new component:

- [ ] Follow component architecture (UI vs Page vs Presentational)
- [ ] Use existing UI primitives from Radix
- [ ] Export TypeScript types
- [ ] Add to appropriate folder
- [ ] Use Zustand for state if needed
- [ ] Follow naming conventions
- [ ] Add Tailwind classes (no custom CSS unless necessary)

---

## References

- Related: [[ANALYSIS]] - Feature analysis
- Related: [[PLANNING]] - Implementation strategy
- Related: [[EXECUTION]] - Task breakdown
