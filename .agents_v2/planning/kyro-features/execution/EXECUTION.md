# EXECUTION.md - Kyro Feature Enhancement Task Breakdown

## Execution Overview

This document defines the concrete tasks for implementing the feature enhancements across 3 sprints.

---

## Phase 1: Foundation (Sprint 1)

### Phase 1 Objectives

Deliver core collapsible features and basic markdown editor with split view.

### Tasks

#### 1.1 Column Collapse MVP

**T-001: Add collapsed state to store**
- **File:** `lib/store.ts`
- **Action:** Add `collapsedColumns: Record<string, boolean>` to UI state
- **After Code:**
```typescript
collapsedColumns: Record<string, boolean>;
setColumnCollapsed: (columnId: string, collapsed: boolean) => void;
toggleColumnCollapsed: (columnId: string) => void;
```
- **Verification:** `npm run build` passes
- **Convention:** Follow existing store patterns in [[CONVENTIONS]]

---

**T-002: Create CollapsedColumn component**
- **File:** `components/kanban/board-column.tsx` (modify)
- **Action:** Add collapsed state handling, chevron button, width transition
- **Before Code:**
```typescript
<div className="flex w-72 flex-col rounded-lg bg-sidebar">
```
- **After Code:**
```typescript
<div className={cn(
  "flex flex-col rounded-lg bg-sidebar transition-all duration-300",
  collapsed ? "w-16" : "w-72"
)}>
```
- **Verification:** Manual test - click chevron, column collapses
- **Convention:** Use existing BoardColumn patterns

---

**T-003: Add collapse toggle to SprintBoard**
- **File:** `components/pages/sprint-board.tsx` (modify)
- **Action:** Pass collapsed state to columns, handle toggle
- **Verification:** Columns collapse independently

---

**T-004: Add column collapse styles**
- **File:** `app/globals.css` (or existing CSS)
- **Action:** Add transition utilities for width animation
- **Verification:** Smooth 300ms transition

---

#### 1.2 Sidebar Collapse MVP

**T-005: Add sidebar collapsed state**
- **File:** `lib/store.ts`
- **Action:** Add `sidebarCollapsed: boolean` to UI state
- **After Code:**
```typescript
sidebarCollapsed: boolean;
setSidebarCollapsed: (collapsed: boolean) => void;
toggleSidebar: () => void;
```

---

**T-006: Create sidebar toggle button**
- **File:** `components/app-sidebar.tsx` (modify)
- **Action:** Add toggle button in header, animate width
- **Before Code:**
```typescript
<aside className="flex h-screen w-64 shrink-0 flex-col border-r">
```
- **After Code:**
```typescript
<aside className={cn(
  "flex h-screen shrink-0 flex-col border-r transition-all duration-300",
  sidebarCollapsed ? "w-16" : "w-64"
)}>
```
- **Verification:** Click toggle, sidebar collapses

---

**T-007: Add collapsed state to sidebar navigation**
- **File:** `components/app-sidebar.tsx` (modify)
- **Action:** Hide labels when collapsed, show icons only, add tooltips
- **Verification:** Icons visible, labels hidden when collapsed

---

#### 1.3 Markdown Editor Split View

**T-008: Create MarkdownEditor component**
- **File:** `components/editor/markdown-editor.tsx` (new)
- **Action:** Create split view with editor and preview panels
- **Dependencies:** react-resizable-panels (already installed)
- **After Code:**
```typescript
export function MarkdownEditor({ 
  value, 
  onChange 
}: { value: string; onChange: (value: string) => void }) {
  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={50}>
        <Textarea value={value} onChange={e => onChange(e.target.value)} />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={50}>
        <ReactMarkdown>{value}</ReactMarkdown>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
```
- **Verification:** Split view renders, panels resizable

---

**T-009: Create MarkdownToolbar component**
- **File:** `components/editor/markdown-toolbar.tsx` (new)
- **Action:** Add toolbar with Bold, Italic, Code, Link, List buttons
- **After Code:**
```typescript
const tools = [
  { icon: Bold, action: 'bold', label: 'Bold' },
  { icon: Italic, action: 'italic', label: 'Italic' },
  { icon: Code, action: 'code', label: 'Code' },
  { icon: Link, action: 'link', label: 'Link' },
  { icon: List, action: 'list', label: 'List' },
];
```
- **Verification:** Toolbar renders, buttons apply formatting

---

**T-010: Integrate MarkdownEditor in DocumentsPage**
- **File:** `components/pages/documents-page.tsx` (modify)
- **Action:** Replace textarea with MarkdownEditor component
- **Verification:** Documents page shows split view

---

**T-011: Add markdown parsing utilities**
- **File:** `lib/markdown.ts` (new)
- **Action:** Create helper functions for insert formatting
- **After Code:**
```typescript
export function insertFormatting(
  text: string,
  selection: { start: number; end: number },
  format: 'bold' | 'italic' | 'code' | 'link' | 'list'
): string { /* implementation */ }
```
- **Verification:** Toolbar buttons insert correct markdown

---

#### 1.4 Phase 1 Verification

- [ ] Run `npm run lint` - no errors
- [ ] Run `npm run build` - builds successfully
- [ ] Manual: Column collapse works smoothly
- [ ] Manual: Sidebar collapse works smoothly
- [ ] Manual: Markdown editor shows split view
- [ ] Manual: Toolbar applies formatting

---

## Phase 2: Persistence & Enhancement (Sprint 2)

### Phase 2 Objectives

Add persistence, keyboard shortcuts, task counters, auto-collapse on mobile, and document version history.

### Tasks

#### 2.1 Persistence

**T-012: Persist sidebar state**
- **File:** `components/app-sidebar.tsx` (modify)
- **Action:** Use localStorage for sidebar state
- **After Code:**
```typescript
useEffect(() => {
  const saved = localStorage.getItem('sidebarCollapsed');
  if (saved) setSidebarCollapsed(JSON.parse(saved));
}, []);

useEffect(() => {
  localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
}, [sidebarCollapsed]);
```

---

**T-013: Persist column collapse state**
- **File:** `components/pages/sprint-board.tsx` (modify)
- **Action:** Persist per-sprint column states to localStorage
- **Key:** `kyro-column-state-${sprintId}`

---

**T-014: Create useLocalStorage hook**
- **File:** `hooks/use-local-storage.ts` (new)
- **Action:** Abstract localStorage logic for reuse
- **After Code:**
```typescript
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // implementation with SSR safety
}
```

---

#### 2.2 Keyboard Shortcuts

**T-015: Add ⌘+B keyboard shortcut**
- **File:** `components/app-sidebar.tsx` (modify)
- **Action:** Add useEffect for keyboard listener
- **After Code:**
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
      e.preventDefault();
      toggleSidebar();
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [toggleSidebar]);
```

---

**T-016: Add toast notification for shortcut**
- **File:** `components/app-sidebar.tsx` (modify)
- **Action:** Use existing sonner toast on toggle
- **Verification:** Toast shows "Sidebar collapsed/expanded"

---

#### 2.3 Task Counters & Indicators

**T-017: Add task counter badge to collapsed column**
- **File:** `components/kanban/board-column.tsx` (modify)
- **Action:** Show count badge when collapsed
- **After Code:**
```typescript
{collapsed && (
  <Badge variant="secondary" className="mt-2">
    {tasks.length}
  </Badge>
)}
```

---

**T-018: Add blocked task indicator**
- **File:** `components/kanban/board-column.tsx` (modify)
- **Action:** Show blocked indicator icon when tasks have blockers
- **Convention:** Use existing Badge patterns

---

#### 2.4 Auto-Collapse on Mobile

**T-019: Add mobile detection hook**
- **File:** `hooks/use-mobile.ts` (check existing)
- **Action:** Use existing hook or create if needed

---

**T-020: Auto-collapse sidebar on mobile**
- **File:** `components/app-sidebar.tsx` (modify)
- **Action:** Default collapsed on screens < 768px
- **After Code:**
```typescript
const isMobile = useMobile();
const defaultCollapsed = isMobile ?? false;
```

---

#### 2.5 Document Version History

**T-021: Create version history store**
- **File:** `lib/store.ts` (extend)
- **Action:** Add document versions to store
- **After Code:**
```typescript
documentVersions: Record<string, DocumentVersion[]>;
addDocumentVersion: (docId: string, content: string) => void;
restoreDocumentVersion: (docId: string, versionId: string) => void;
```

---

**T-022: Create VersionHistory component**
- **File:** `components/editor/version-history.tsx` (new)
- **Action:** Show list of versions with restore button
- **Dependencies:** Use existing Dialog for version picker

---

**T-023: Add version history UI to DocumentsPage**
- **File:** `components/pages/documents-page.tsx` (modify)
- **Action:** Add version history button and panel
- **Verification:** Can view and restore previous versions

---

#### 2.6 Autosave

**T-024: Add debounced autosave**
- **File:** `components/pages/documents-page.tsx` (modify)
- **Action:** Implement 2-second debounce on document changes
- **Dependencies:** Use lodash.debounce or custom implementation

---

**T-025: Add saving indicator**
- **File:** `components/pages/documents-page.tsx` (modify)
- **Action:** Show "Saving..." / "Saved" status
- **Verification:** Status updates as user types

---

#### 2.7 Phase 2 Verification

- [ ] Run `npm run lint` - no errors
- [ ] Refresh page - sidebar/column states persist
- [ ] Press ⌘+B - sidebar toggles with toast
- [ ] Collapse column - count badge shows
- [ ] Open on mobile - sidebar auto-collapsed
- [ ] Edit document - version created
- [ ] Restore version - content restored
- [ ] Type in editor - "Saved" appears after 2s

---

## Phase 3: Advanced Features (Sprint 3)

### Phase 3 Objectives

Implement Focus Mode, Zen Mode, command palette, Vim keybindings, diff viewer, and smart highlights.

### Tasks

#### 3.1 Focus Mode / Zen Mode

**T-026: Create FocusMode toggle**
- **File:** `lib/store.ts` (extend)
- **Action:** Add `focusMode: boolean`, `zenColumns: string[]`
- **After Code:**
```typescript
focusMode: boolean;
focusedColumnId: string | null;
setFocusedColumn: (columnId: string | null) => void;
zenMode: boolean;
setZenMode: (enabled: boolean) => void;
```

---

**T-027: Implement Focus Mode UI**
- **File:** `components/pages/sprint-board.tsx` (modify)
- **Action:** Show only focused column, others collapsed
- **Verification:** Click column header to focus

---

**T-028: Implement Zen Mode preset**
- **File:** `components/pages/sprint-board.tsx` (modify)
- **Action:** Only show In Progress + Review columns
- **Verification:** Toggle shows correct columns

---

#### 3.2 Command Palette

**T-029: Create CommandPalette component**
- **File:** `components/command-palette.tsx` (new)
- **Action:** Wrap existing cmdk component
- **Dependencies:** cmdk already installed

---

**T-030: Add command palette actions**
- **File:** `components/command-palette.tsx` (modify)
- **Actions:**
  - Toggle sidebar
  - Toggle focus mode
  - New task
  - Jump to sprint
  - Jump to document

---

**T-031: Add ⌘+K keyboard shortcut**
- **File:** `components/command-palette.tsx` (modify)
- **Action:** Open palette on ⌘+K
- **Verification:** Palette opens with shortcut

---

#### 3.3 Vim Keybindings

**T-032: Research Vim integration**
- **Action:** Evaluate @replit/codemirror-vim vs alternatives
- **Decision:** Document in [[DECISIONS]]

---

**T-033: Add Vim mode toggle**
- **File:** `components/editor/markdown-editor.tsx` (modify)
- **Action:** Add Vim/Insert mode toggle
- **Verification:** Can toggle between modes

---

**T-034: Implement Vim commands**
- **File:** `components/editor/markdown-editor.tsx` (modify)
- **Action:** Basic commands (i, a, o, dd, yy, p)
- **Convention:** Use existing editor patterns

---

#### 3.4 Diff Viewer

**T-035: Create DiffViewer component**
- **File:** `components/editor/diff-viewer.tsx` (new)
- **Action:** Show diff between two versions
- **Dependencies:** Use `diff` package

---

**T-036: Integrate diff in version history**
- **File:** `components/editor/version-history.tsx` (modify)
- **Action:** Show diff when comparing versions
- **Verification:** Can see additions/deletions highlighted

---

#### 3.5 Smart Highlights

**T-037: Add overdue highlighting**
- **File:** `components/kanban/task-card.tsx` (modify)
- **Action:** Check due date vs current date
- **After Code:**
```typescript
const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
// Apply red border/bg
```

---

**T-038: Add blocked task highlighting**
- **File:** `components/kanban/task-card.tsx` (modify)
- **Action:** Check if task has blocking dependencies
- **Convention:** Use existing Badge patterns

---

**T-039: Add AI-created task highlighting**
- **File:** `components/kanban/task-card.tsx` (modify)
- **Action:** Check task metadata for AI flag
- **After Code:**
```typescript
const isAICreated = task.metadata?.createdBy === 'agent';
// Apply purple border/bg
```

---

#### 3.6 Activity Indicators

**T-040: Add task create glow animation**
- **File:** `components/kanban/task-card.tsx` (modify)
- **Action:** Add Framer Motion animate on mount
- **Verification:** New tasks have subtle glow

---

**T-041: Add sidebar edit indicator**
- **File:** `components/app-sidebar.tsx` (modify)
- **Action:** Show dot indicator when document edited recently
- **Convention:** Use existing Badge patterns

---

#### 3.7 Phase 3 Verification

- [ ] Run `npm run lint` - no errors
- [ ] Focus mode - only one column visible
- [ ] Zen mode - only In Progress + Review visible
- [ ] ⌘+K - command palette opens
- [ ] Vim mode - basic commands work
- [ ] Diff viewer - shows version differences
- [ ] Overdue tasks - highlighted in red
- [ ] Blocked tasks - highlighted appropriately

---

## Resource Allocation

| Task | Owner | Phase |
|------|-------|-------|
| Store extensions | Dev | 1 |
| Column collapse | Dev | 1 |
| Sidebar collapse | Dev | 1 |
| Markdown editor | Dev | 1 |
| Persistence | Dev | 2 |
| Keyboard shortcuts | Dev | 2 |
| Version history | Dev | 2 |
| Focus/Zen mode | Dev | 3 |
| Command palette | Dev | 3 |
| Vim keybindings | Dev | 3 |

---

## Risk Monitoring

| Risk | Mitigation | Monitor |
|------|------------|---------|
| Animation jank | Test on low-end devices | Sprint 1 |
| localStorage overflow | LRU cache for versions | Sprint 2 |
| Vim complexity | Basic commands only first | Sprint 3 |

---

## References

- Related: [[CONVENTIONS]] - Codebase patterns
- Related: [[ANALYSIS]] - Feature analysis
- Related: [[PLANNING]] - Implementation strategy
- Related: [[PROGRESS]] - Sprint tracking
