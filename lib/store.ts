import { create } from "zustand";
import type {
  Project,
  AgentActivity,
  Task,
  TaskStatus,
  Sprint,
  SprintMarkdownSections,
  Document,
  DocumentVersion,
  TeamMember,
  LoadingState,
} from "./types";
import { getInitialState } from "./services/mock/seed";
import { services } from "./services";

interface AppState {
  // Multi-project management
  projects: Project[];
  activeProjectId: string;
  setActiveProjectId: (id: string) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Current project helper
  getActiveProject: () => Project;

  // README (scoped to active project)
  updateReadme: (content: string) => void;

  // Documents (scoped to active project)
  addDocument: (doc: Document) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  deleteDocument: (id: string) => void;

  // Sprints (scoped to active project)
  addSprint: (sprint: Sprint) => void;
  updateSprint: (id: string, updates: Partial<Sprint>) => void;
  updateSprintSection: (
    sprintId: string,
    sectionKey: keyof SprintMarkdownSections,
    content: string
  ) => void;

  // Tasks (scoped to active project)
  addTask: (sprintId: string, task: Task) => void;
  updateTask: (sprintId: string, taskId: string, updates: Partial<Task>) => void;
  moveTask: (sprintId: string, taskId: string, newStatus: TaskStatus) => void;
  deleteTask: (sprintId: string, taskId: string) => void;

  // Async initialization state
  isInitializing: boolean;
  initError: string | null;
  initializeApp: () => Promise<void>;

  // Team Members
  members: TeamMember[];
  addMember: (member: TeamMember) => void;
  updateMember: (name: string, updates: Partial<TeamMember>) => void;
  removeMember: (name: string) => void;

  // Agent Activity
  activities: AgentActivity[];
  addActivity: (activity: AgentActivity) => void;

  // UI State
  activeSidebarItem: string;
  setActiveSidebarItem: (item: string) => void;
  activeSprintId: string | null;
  setActiveSprintId: (id: string | null) => void;
  activeSprintDetailId: string | null;
  setActiveSprintDetailId: (id: string | null) => void;

  // Sidebar State
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;

  // Column Collapse State (per sprint)
  collapsedColumns: Record<string, boolean>;
  setColumnCollapsed: (sprintId: string, columnId: string, collapsed: boolean) => void;
  toggleColumnCollapsed: (sprintId: string, columnId: string) => void;

  // Document Version History
  documentVersions: Record<string, DocumentVersion[]>;
  addDocumentVersion: (docId: string, content: string, title: string) => void;
  restoreDocumentVersion: (docId: string, versionId: string) => void;
  getDocumentVersions: (docId: string) => DocumentVersion[];

  // Focus Mode / Zen Mode
  focusMode: boolean;
  focusedColumnId: string | null;
  setFocusedColumn: (columnId: string | null) => void;
  toggleFocusMode: () => void;
  zenMode: boolean;
  setZenMode: (enabled: boolean) => void;

  // Command Palette
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
}

// Helper to update sprints inside a project
function updateProjectSprints(
  projects: Project[],
  projectId: string,
  updater: (sprints: Sprint[]) => Sprint[]
): Project[] {
  return projects.map((p) =>
    p.id === projectId
      ? { ...p, sprints: updater(p.sprints), updatedAt: new Date().toISOString() }
      : p
  );
}

const { projects: initialProjects, members: initialMembers, activities: initialActivities } = getInitialState();

export const useAppStore = create<AppState>((set, get) => ({
  projects: initialProjects,
  activeProjectId: initialProjects[0].id,

  setActiveProjectId: (id) =>
    set({ activeProjectId: id, activeSprintId: null, activeSprintDetailId: null, activeSidebarItem: "overview" }),

  addProject: (project) =>
    set((state) => ({ projects: [...state.projects, project] })),

  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      ),
    })),

  deleteProject: (id) =>
    set((state) => {
      const remaining = state.projects.filter((p) => p.id !== id);
      return {
        projects: remaining,
        activeProjectId:
          state.activeProjectId === id
            ? remaining[0]?.id ?? ""
            : state.activeProjectId,
      };
    }),

  getActiveProject: () => {
    const state = get();
    return state.projects.find((p) => p.id === state.activeProjectId) ?? state.projects[0];
  },

  updateReadme: (content) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === state.activeProjectId
          ? { ...p, readme: content, updatedAt: new Date().toISOString() }
          : p
      ),
    })),

  addDocument: (doc) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === state.activeProjectId
          ? { ...p, documents: [...p.documents, doc], updatedAt: new Date().toISOString() }
          : p
      ),
    })),

  updateDocument: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === state.activeProjectId
          ? {
              ...p,
              documents: p.documents.map((d) =>
                d.id === id
                  ? { ...d, ...updates, updatedAt: new Date().toISOString() }
                  : d
              ),
              updatedAt: new Date().toISOString(),
            }
          : p
      ),
    })),

  deleteDocument: (id) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === state.activeProjectId
          ? { ...p, documents: p.documents.filter((d) => d.id !== id) }
          : p
      ),
    })),

  addSprint: (sprint) =>
    set((state) => ({
      projects: updateProjectSprints(
        state.projects,
        state.activeProjectId,
        (sprints) => [...sprints, sprint]
      ),
    })),

  updateSprint: (id, updates) =>
    set((state) => ({
      projects: updateProjectSprints(
        state.projects,
        state.activeProjectId,
        (sprints) => sprints.map((s) => (s.id === id ? { ...s, ...updates } : s))
      ),
    })),

  updateSprintSection: (sprintId, sectionKey, content) =>
    set((state) => ({
      projects: updateProjectSprints(
        state.projects,
        state.activeProjectId,
        (sprints) =>
          sprints.map((s) =>
            s.id === sprintId
              ? {
                  ...s,
                  sections: {
                    ...s.sections,
                    [sectionKey]: content,
                  },
                }
              : s
          )
      ),
    })),

  addTask: (sprintId, task) =>
    set((state) => ({
      projects: updateProjectSprints(
        state.projects,
        state.activeProjectId,
        (sprints) =>
          sprints.map((s) =>
            s.id === sprintId ? { ...s, tasks: [...s.tasks, task] } : s
          )
      ),
    })),

  updateTask: (sprintId, taskId, updates) =>
    set((state) => ({
      projects: updateProjectSprints(
        state.projects,
        state.activeProjectId,
        (sprints) =>
          sprints.map((s) =>
            s.id === sprintId
              ? {
                  ...s,
                  tasks: s.tasks.map((t) =>
                    t.id === taskId
                      ? { ...t, ...updates, updatedAt: new Date().toISOString() }
                      : t
                  ),
                }
              : s
          )
      ),
    })),

  moveTask: (sprintId, taskId, newStatus) =>
    set((state) => ({
      projects: updateProjectSprints(
        state.projects,
        state.activeProjectId,
        (sprints) =>
          sprints.map((s) =>
            s.id === sprintId
              ? {
                  ...s,
                  tasks: s.tasks.map((t) =>
                    t.id === taskId
                      ? { ...t, status: newStatus, updatedAt: new Date().toISOString() }
                      : t
                  ),
                }
              : s
          )
      ),
    })),

  deleteTask: (sprintId, taskId) =>
    set((state) => ({
      projects: updateProjectSprints(
        state.projects,
        state.activeProjectId,
        (sprints) =>
          sprints.map((s) =>
            s.id === sprintId
              ? { ...s, tasks: s.tasks.filter((t) => t.id !== taskId) }
              : s
          )
      ),
    })),

  isInitializing: false,
  initError: null,
  initializeApp: async () => {
    set({ isInitializing: true, initError: null });
    try {
      const [projects, members, activities] = await Promise.all([
        services.projects.list(),
        services.members.list(),
        services.activities.list(),
      ]);
      set({ projects, members, activities, isInitializing: false });
    } catch (err) {
      set({
        isInitializing: false,
        initError: err instanceof Error ? err.message : "Failed to initialize app",
      });
    }
  },

  members: initialMembers,
  addMember: (member) =>
    set((state) => ({ members: [...state.members, member] })),
  updateMember: (name, updates) =>
    set((state) => ({
      members: state.members.map((m) => (m.name === name ? { ...m, ...updates } : m)),
    })),
  removeMember: (name) =>
    set((state) => ({ members: state.members.filter((m) => m.name !== name) })),

  activities: initialActivities,
  addActivity: (activity) =>
    set((state) => ({ activities: [activity, ...state.activities] })),

  activeSidebarItem: "overview",
  setActiveSidebarItem: (item) => set({ activeSidebarItem: item }),
  activeSprintId: null,
  setActiveSprintId: (id) => set({ activeSprintId: id }),
  activeSprintDetailId: null,
  setActiveSprintDetailId: (id) => set({ activeSprintDetailId: id }),

  // Sidebar State
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  // Column Collapse State
  collapsedColumns: {},
  setColumnCollapsed: (sprintId, columnId, collapsed) =>
    set((state) => ({
      collapsedColumns: {
        ...state.collapsedColumns,
        [`${sprintId}-${columnId}`]: collapsed,
      },
    })),
  toggleColumnCollapsed: (sprintId, columnId) =>
    set((state) => ({
      collapsedColumns: {
        ...state.collapsedColumns,
        [`${sprintId}-${columnId}`]: !state.collapsedColumns[`${sprintId}-${columnId}`],
      },
    })),

  // Document Version History
  documentVersions: {},
  addDocumentVersion: (docId, content, title) =>
    set((state) => {
      const newVersion: DocumentVersion = {
        id: `ver-${Date.now()}`,
        docId,
        content,
        title,
        createdAt: new Date().toISOString(),
      };
      const existingVersions = state.documentVersions[docId] || [];
      const updatedVersions = [newVersion, ...existingVersions].slice(0, 10);
      return {
        documentVersions: {
          ...state.documentVersions,
          [docId]: updatedVersions,
        },
      };
    }),
  restoreDocumentVersion: (docId, versionId) =>
    set((state) => {
      const versions = state.documentVersions[docId] || [];
      const version = versions.find((v) => v.id === versionId);
      if (!version) return state;
      
      const activeProject = state.projects.find((p) => p.id === state.activeProjectId);
      if (!activeProject) return state;
      
      return {
        projects: state.projects.map((p) =>
          p.id === state.activeProjectId
            ? {
                ...p,
                documents: p.documents.map((d) =>
                  d.id === docId
                    ? { ...d, content: version.content, title: version.title, updatedAt: new Date().toISOString() }
                    : d
                ),
                updatedAt: new Date().toISOString(),
              }
            : p
        ),
      };
    }),
  getDocumentVersions: (docId) => {
    const state = get();
    return state.documentVersions[docId] || [];
  },

  // Focus Mode / Zen Mode
  focusMode: false,
  focusedColumnId: null,
  setFocusedColumn: (columnId) => set({ focusedColumnId: columnId }),
  toggleFocusMode: () => set((state) => ({ focusMode: !state.focusMode })),
  zenMode: false,
  setZenMode: (enabled) => set({ zenMode: enabled }),

  // Command Palette
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
}));
