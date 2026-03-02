# ANALYSIS.md - Kyro Feature Enhancement Analysis

## Executive Summary

This document analyzes the proposed feature enhancements for the Kyro project (formerly Clever), a Next.js-based project management tool with Kanban boards, sprints, and AI agent integration. The features are categorized into three major groups:

1. **Column Collapsible Board** - Collapsible kanban columns
2. **Collapsible Sidebar** - Left navigation collapse
3. **Markdown Editor** - Enhanced document editing

Each feature is analyzed for technical feasibility, dependencies, and implementation complexity.

---

## Current State Assessment

### Existing Architecture

| Component | Current State |
|-----------|----------------|
| Kanban Board | Fixed 5 columns (backlog, todo, in_progress, review, done) |
| Sidebar | Fixed width (w-64), always visible |
| Documents | Basic textarea, no markdown preview |
| State Management | Zustand store, no persistence |
| Drag & Drop | @dnd-kit for task movement |

### Key Files to Modify

| File | Purpose | Change Type |
|------|---------|--------------|
| `components/pages/sprint-board.tsx` | Main board component | Modify - add column collapse state |
| `components/kanban/board-column.tsx` | Column component | Modify - support collapsed state |
| `components/app-sidebar.tsx` | Sidebar navigation | Modify - add collapse toggle |
| `components/pages/documents-page.tsx` | Document editing | Modify - add markdown editor |
| `lib/store.ts` | Zustand store | Extend - add UI preferences |
| `lib/types.ts` | Type definitions | Extend - add new types |

---

## Feature Analysis

### Feature Group 1: Column Collapsible Board

#### MVP (Level Basic - Elegant)

**Description:** Button in column header to collapse columns, showing only title vertically.

**Components Affected:**
- `BoardColumn` - needs collapsed state
- `SprintBoard` - needs column state management

**Technical Requirements:**
- Column width transition (280px → 50px)
- Chevron button in header
- Hide task cards when collapsed
- Show vertical title when collapsed

**Complexity:** Low  
**Risk:** Low

#### Level Medium (UX Premium)

**Description:** Smooth animations, task counters, blocked indicators, localStorage persistence.

**Technical Requirements:**
- Framer Motion for width transitions
- localStorage for collapse state per sprint
- Task count badge
- Blocked task indicator (from existing task data)

**Complexity:** Medium  
**Risk:** Low

#### Level Advanced (AI-Aware)

**Description:** Auto-collapse empty columns, suggest collapse for large columns.

**Technical Requirements:**
- Auto-detect column task count
- Threshold-based suggestions (>20 tasks)
- Toast notification for suggestions

**Complexity:** Medium  
**Risk:** Low

#### Additional Modes

| Mode | Description | Technical Impact |
|------|-------------|------------------|
| Focus Mode | Only one column visible | Single-column state, expand on hover |
| Zen Mode | Only In Progress + Review visible | Pre-configured column set |

---

### Feature Group 2: Collapsible Sidebar

#### MVP

**Description:** Toggle button to collapse sidebar, width 240px → 64px.

**Technical Requirements:**
- Add collapse state to store
- Width transition in CSS
- Toggle button (can reuse Chevron)
- Tooltip on hover for collapsed icons

**Complexity:** Low  
**Risk:** Low

#### Enhanced UX

**Description:** Smooth transitions, localStorage persistence, auto-collapse on small screens.

**Technical Requirements:**
- CSS transition (200-300ms)
- Media query for mobile (<768px)
- Persist to localStorage

**Complexity:** Low  
**Risk:** Low

#### Hacker Mode

**Description:** Keyboard shortcut (⌘+B), quick toggle like VSCode.

**Technical Requirements:**
- Global keyboard listener
- Command palette integration (existing cmdk)
- Toast notification on toggle

**Complexity:** Low  
**Risk:** Low

#### Contextual Sidebar

**Description:** Show different items based on context (Sprint vs Docs).

**Technical Requirements:**
- Context-aware navigation items
- Active route detection

**Complexity:** Medium  
**Risk:** Low

---

### Feature Group 3: Markdown Editor

#### Level Basic

**Description:** Split view (editor left, preview right) with minimal toolbar.

**Technical Requirements:**
- Split panel layout (react-resizable-panels available)
- Toolbar: Bold, Italic, Code, Link, List buttons
- react-markdown for preview (already installed)
- Manual save button

**Complexity:** Medium  
**Risk:** Low

#### Level Pro

**Description:** Autosave, version history, diff viewer, syntax highlighting.

**Technical Requirements:**
- Debounced autosave (2s delay)
- Version storage in localStorage (last 5 versions)
- Diff visualization
- Code syntax highlighting (highlight.js or similar)

**Complexity:** Medium-High  
**Risk:** Medium

#### AI-Native

**Description:** AI-powered features - improve writing, summarize, generate tasks.

**Technical Requirements:**
- API integration for AI (placeholder for now)
- Task generation from document content
- Inline suggestions UI

**Complexity:** High  
**Risk:** High (AI integration complexity)

#### Hacker Mode

**Description:** Raw markdown mode, Vim keybindings, slash commands.

**Technical Requirements:**
- Toggle between WYSIWYG and raw markdown
- Vim mode library (e.g., @replit/codemirror-vim)
- Slash command handler (`/task`, `/sprint`)

**Complexity:** High  
**Risk:** Medium

---

### Additional Features

#### Power Features

| Feature | Description | Complexity |
|---------|-------------|------------|
| Command Palette | ⌘K for quick actions | Medium |
| Quick Add Task | Enter anywhere to add | Low |
| Global Search | Search across sprints/docs | Medium |
| Jump to... | Quick navigation | Low |

#### Board Enhancements

| Feature | Description | Complexity |
|---------|-------------|------------|
| Column Settings | WIP limit, color, auto-sort | Medium |
| Task Density | Compact/Comfortable/Spacious modes | Low |
| Board Zoom | Ctrl+scroll for zoom | Low |
| Smart Highlights | Overdue, blocked, AI-created | Medium |

#### Agent-Aware Features

| Feature | Description | Complexity |
|---------|-------------|------------|
| Activity Glow | Glow on task create/move | Low |
| Sidebar Indicators | Document edit indicator | Low |
| Activity Heatmap | Visual activity tracking | Medium |

---

## Technical Analysis

### Dependencies Already Available

| Package | Purpose | Status |
|---------|---------|--------|
| @radix-ui/react-collapsible | Collapsible UI | Already installed |
| react-resizable-panels | Split view | Already installed |
| framer-motion | Animations | Already installed |
| react-markdown | Markdown preview | Already installed |
| cmdk | Command palette | Already installed |
| zustand | State management | Already installed |
| lucide-react | Icons | Already installed |

### New Dependencies Required

| Package | Purpose | Sprint |
|---------|---------|--------|
| react-markdown + plugins | Syntax highlighting in preview | 2 |
| @replit/codemirror-vim | Vim keybindings | 3 |
| diff | Version diffing | 2 |

---

## Constraints & Risks

### Technical Constraints

1. **State Persistence:** localStorage has 5MB limit - need to manage version history size
2. **Animation Performance:** Multiple collapsing elements may cause jank - use will-change
3. **Mobile Support:** Collapsible features need touch-friendly alternatives

### Identified Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| AI integration complexity | Medium | High | Phase AI features to later sprint |
| Version history bloat | High | Low | Implement LRU cache for versions |
| Breaking drag-drop when collapsed | Medium | High | Disable drag when column collapsed |

---

## Success Criteria

### MVP Features (Sprint 1)

- [ ] Column collapse with chevron button
- [ ] Sidebar collapse with toggle
- [ ] Markdown split view editor
- [ ] Basic toolbar (Bold, Italic, Code, Link)
- [ ] Smooth transitions

### Pro Features (Sprint 2)

- [ ] Collapse state persistence (localStorage)
- [ ] Task counters on collapsed columns
- [ ] Auto-collapse on small screens
- [ ] Keyboard shortcut (⌘+B)
- [ ] Version history for documents
- [ ] Autosave

### Advanced Features (Sprint 3)

- [ ] Focus Mode / Zen Mode
- [ ] AI-aware suggestions
- [ ] Vim keybindings
- [ ] Command palette
- [ ] Diff viewer
- [ ] Smart highlights

---

## Recommendations

### Priority Order

1. **Sprint 1:** MVP features (collapse basics, markdown editor)
2. **Sprint 2:** Persistence, enhanced UX, keyboard shortcuts
3. **Sprint 3:** Advanced features (AI, Vim, power features)

### Scope Control

- MVP features are well-defined and low-risk
- AI features should be stubbed/mocked initially
- Power features can be added incrementally

---

## References

- Related: [[CONVENTIONS]] - Codebase patterns
- Related: [[PLANNING]] - Implementation strategy
- Related: [[EXECUTION]] - Task breakdown
