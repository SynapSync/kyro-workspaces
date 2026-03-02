# PLANNING.md - Kyro Feature Enhancement Implementation Plan

## Implementation Strategy Overview

The feature enhancements will be implemented across **3 sprints**, prioritizing MVP features that provide immediate value while setting up infrastructure for advanced features.

### Core Principles

1. **Progressive Enhancement:** Build MVP first, then layer on advanced features
2. **Component Reuse:** Leverage existing Radix primitives (especially `Collapsible`)
3. **State Isolation:** New UI state in separate store slices
4. **Persistence Strategy:** LocalStorage for preferences, Zustand for runtime state

---

## Conventions Alignment

### Existing Patterns to Reuse

| Pattern | Application |
|---------|-------------|
| Zustand store slice | UI preferences state |
| Radix Collapsible | Column collapse implementation |
| Framer Motion | Smooth transitions |
| LocalStorage | Persistence for preferences |
| existing `cn()` utility | Conditional classes |

### Justified Deviations

| Deviation | Justification |
|-----------|---------------|
| Custom column collapse vs Radix Collapsible | Need width transition + title rotation which Radix doesn't support natively |
| Direct localStorage in components | UI preferences don't need full store integration |

---

## Execution Phases

### Phase 1: Foundation (Sprint 1)

**Duration:** 1 week  
**Objective:** Deliver core collapsible features and basic markdown editor  
**Deliverables:**

- Collapsible Kanban columns
- Collapsible sidebar
- Markdown split-view editor
- Basic toolbar

**Dependencies:** None (all dependencies already installed)

---

### Phase 2: Persistence & Enhancement (Sprint 2)

**Duration:** 1 week  
**Objective:** Add persistence, keyboard shortcuts, and enhanced UX  
**Deliverables:**

- LocalStorage persistence for all collapsed states
- Keyboard shortcuts (⌘+B for sidebar)
- Task counters on collapsed columns
- Auto-collapse on mobile
- Version history for documents
- Autosave

**Dependencies:** Phase 1 completion

---

### Phase 3: Advanced Features (Sprint 3)

**Duration:** 1-2 weeks  
**Objective:** Power user features and AI integration groundwork  
**Deliverables:**

- Focus Mode / Zen Mode
- AI-aware suggestions (stub)
- Vim keybindings for editor
- Command palette (⌘+K)
- Diff viewer
- Smart highlights (overdue, blocked)
- Activity indicators

**Dependencies:** Phase 2 completion

---

## Resource Plan

### Team Capacity

| Role | Sprint 1 | Sprint 2 | Sprint 3 |
|------|----------|----------|----------|
| Frontend Dev | 80% | 60% | 70% |
| Review/Polish | 20% | 40% | 30% |

### Technical Resources

| Resource | Source |
|----------|--------|
| Radix Collapsible | Already installed |
| Framer Motion | Already installed |
| react-resizable-panels | Already installed |
| cmdk (Command) | Already installed |
| zustand | Already installed |

---

## Risk Mitigation

### Risk 1: Animation Performance

**Mitigation:**
- Use `will-change: width` on animating elements
- Limit concurrent animations
- Test on lower-end devices

### Risk 2: State Persistence Overflow

**Mitigation:**
- Implement LRU cache for version history
- Limit localStorage to 2MB per feature
- Add cleanup on app init

### Risk 3: Breaking Drag-Drop When Collapsed

**Mitigation:**
- Disable drag on collapsed columns
- Add visual indicator for non-droppable columns
- Auto-expand on drag hover (optional)

---

## Feature Phasing Detail

### Sprint 1 Breakdown

| Feature | Tasks | Priority |
|---------|-------|----------|
| Column collapse MVP | 4 | P0 |
| Sidebar collapse MVP | 3 | P0 |
| Markdown editor split | 5 | P0 |
| Basic toolbar | 2 | P0 |
| **Total** | **14** | |

### Sprint 2 Breakdown

| Feature | Tasks | Priority |
|---------|-------|----------|
| Persistence (all) | 3 | P0 |
| Keyboard shortcuts | 2 | P1 |
| Task counters | 2 | P1 |
| Auto-collapse mobile | 1 | P1 |
| Version history | 4 | P1 |
| Autosave | 2 | P1 |
| **Total** | **14** | |

### Sprint 3 Breakdown

| Feature | Tasks | Priority |
|---------|-------|----------|
| Focus/Zen Mode | 3 | P0 |
| Command palette | 4 | P0 |
| Vim keybindings | 3 | P1 |
| Diff viewer | 3 | P1 |
| Smart highlights | 3 | P2 |
| Activity indicators | 2 | P2 |
| **Total** | **18** | |

---

## Verification Strategy

### Sprint 1 Gates

- [ ] Columns collapse/expand smoothly
- [ ] Sidebar collapses with animation
- [ ] Markdown preview renders correctly
- [ ] Toolbar buttons work
- [ ] No regression in existing features

### Sprint 2 Gates

- [ ] Collapse state persists after refresh
- [ ] ⌘+B toggles sidebar
- [ ] Task count shows on collapsed column
- [ ] Mobile layout auto-collapses
- [ ] Document versions can be restored

### Sprint 3 Gates

- [ ] Focus mode shows single column
- [ ] Command palette opens with ⌘+K
- [ ] Vim mode works in editor
- [ ] Diff shows between versions
- [ ] Overdue tasks highlighted

---

## References

- Related: [[CONVENTIONS]] - Codebase patterns
- Related: [[ANALYSIS]] - Feature analysis
- Related: [[EXECUTION]] - Task breakdown
- Related: [[PROGRESS]] - Sprint tracking
