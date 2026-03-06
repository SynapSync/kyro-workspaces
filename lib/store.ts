import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Project,
  AgentActivity,
  AgentActionType,
  ActivitiesDiagnostics,
  Finding,
  RoadmapSprintEntry,
  TeamMember,
} from "./types";
import { services } from "./services";
import { APP_NAME } from "./config";

const errorMsg = (err: unknown) =>
  err instanceof Error ? err.message : "Save failed";

function recordActivity(input: {
  projectId: string;
  actionType: AgentActionType;
  description: string;
  metadata?: Record<string, string>;
}, setWarning?: (value: string | null) => void) {
  services.activities
    .createActivity(input)
    .then(() => setWarning?.(null))
    .catch((err) => {
      const message = errorMsg(err);
      const warning = `Activity log unavailable: ${message}`;
      setWarning?.(warning);
      console.warn("[activity-trace]", warning, input);
    });
}

interface AppState {
  workspaceName: string;

  // Multi-project management
  projects: Project[];
  activeProjectId: string;
  setActiveProjectId: (id: string) => void;
  addProject: (path: string, name?: string, color?: string) => void;
  updateProject: (id: string, updates: { name?: string; color?: string }) => void;
  deleteProject: (id: string) => void;

  // Current project helper
  getActiveProject: () => Project;

  // Findings (per-project, loaded on demand)
  findings: Record<string, Finding[]>;
  findingsLoading: Record<string, boolean>;
  loadFindings: (projectId: string) => Promise<void>;

  // Roadmap (per-project, loaded on demand)
  roadmaps: Record<string, { raw: string; sprints: RoadmapSprintEntry[] }>;
  roadmapLoading: Record<string, boolean>;
  loadRoadmap: (projectId: string) => Promise<void>;

  activeFindingId: string | null;
  setActiveFindingId: (id: string | null) => void;

  // Async initialization state
  isInitializing: boolean;
  initError: string | null;
  initializeApp: () => Promise<void>;

  // Saving state
  isSaving: boolean;
  saveError: string | null;
  setSaveError: (msg: string | null) => void;

  // Team Members
  members: TeamMember[];
  addMember: (member: TeamMember) => void;
  updateMember: (name: string, updates: Partial<TeamMember>) => void;
  removeMember: (name: string) => void;

  // Agent Activity
  activities: AgentActivity[];
  activitiesDiagnostics: ActivitiesDiagnostics | null;
  addActivity: (activity: AgentActivity) => void;
  activityWriteWarning: string | null;
  clearActivityWriteWarning: () => void;

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

  // Add Project Dialog
  addProjectDialogOpen: boolean;
  setAddProjectDialogOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
  workspaceName: APP_NAME,
  projects: [],
  activeProjectId: "",

  setActiveProjectId: (id) =>
    set({ activeProjectId: id, activeSprintId: null, activeSprintDetailId: null, activeSidebarItem: "overview" }),

  addProject: (path, name, color) => {
    set({ isSaving: true, saveError: null });
    services.projects.createProject({ path, name, color })
      .then((entry) => {
        // The POST response is a registry entry, not a full Project.
        // Re-fetch to get the fully parsed project with sprints, documents, etc.
        return services.projects.getProject(entry.id).then((full) => full ?? entry);
      })
      .then((project) => {
        set((state) => ({
          projects: [...state.projects, project],
          activeProjectId: project.id,
          isSaving: false,
        }));
      })
      .catch((err) => set({ isSaving: false, saveError: errorMsg(err) }));
  },

  updateProject: (id, updates) => {
    const prev = get().projects;
    set((state) => ({
      isSaving: true,
      saveError: null,
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      ),
    }));
    services.projects.updateProject(id, updates)
      .then(() => set({ isSaving: false }))
      .catch((err) => set({ projects: prev, isSaving: false, saveError: errorMsg(err) }));
  },

  deleteProject: (id) => {
    const prev = get().projects;
    set((state) => {
      const remaining = state.projects.filter((p) => p.id !== id);
      return {
        isSaving: true,
        saveError: null,
        projects: remaining,
        activeProjectId:
          state.activeProjectId === id
            ? remaining[0]?.id ?? ""
            : state.activeProjectId,
      };
    });
    services.projects.deleteProject(id)
      .then(() => set({ isSaving: false }))
      .catch((err) => set({ projects: prev, isSaving: false, saveError: errorMsg(err) }));
  },

  getActiveProject: () => {
    const state = get();
    return state.projects.find((p) => p.id === state.activeProjectId) ?? state.projects[0];
  },

  // --- Findings ---

  findings: {},
  findingsLoading: {},
  loadFindings: async (projectId) => {
    set((state) => ({
      findingsLoading: { ...state.findingsLoading, [projectId]: true },
    }));
    try {
      const findings = await services.projects.getFindings(projectId);
      set((state) => ({
        findings: { ...state.findings, [projectId]: findings },
        findingsLoading: { ...state.findingsLoading, [projectId]: false },
      }));
    } catch (err) {
      set((state) => ({
        findingsLoading: { ...state.findingsLoading, [projectId]: false },
      }));
      console.warn("[findings] Failed to load:", errorMsg(err));
    }
  },

  // --- Roadmaps ---

  roadmaps: {},
  roadmapLoading: {},
  loadRoadmap: async (projectId) => {
    set((state) => ({
      roadmapLoading: { ...state.roadmapLoading, [projectId]: true },
    }));
    try {
      const roadmap = await services.projects.getRoadmap(projectId);
      set((state) => ({
        roadmaps: { ...state.roadmaps, [projectId]: roadmap },
        roadmapLoading: { ...state.roadmapLoading, [projectId]: false },
      }));
    } catch (err) {
      set((state) => ({
        roadmapLoading: { ...state.roadmapLoading, [projectId]: false },
      }));
      console.warn("[roadmap] Failed to load:", errorMsg(err));
    }
  },

  activeFindingId: null,
  setActiveFindingId: (id) => set({ activeFindingId: id }),

  // --- Async init ---

  isInitializing: true,
  initError: null,
  initializeApp: async () => {
    set({ isInitializing: true, initError: null });
    try {
      const workspaceNamePromise = fetch("/api/workspace")
        .then(async (response) => {
          if (!response.ok) return null;
          const json = (await response.json()) as {
            data?: { workspace?: { name?: string } };
          };
          return json.data?.workspace?.name ?? null;
        })
        .catch(() => null);

      const [projects, members, activitiesResult, workspaceName] = await Promise.all([
        services.projects.list(),
        services.members.list(),
        services.activities.list(),
        workspaceNamePromise,
      ]);
      set((state) => ({
        projects,
        members,
        activities: activitiesResult.activities,
        activitiesDiagnostics: activitiesResult.diagnostics,
        workspaceName: workspaceName ?? APP_NAME,
        activeProjectId:
          state.activeProjectId && projects.some((p) => p.id === state.activeProjectId)
            ? state.activeProjectId
            : projects[0]?.id ?? "",
        isInitializing: false,
      }));
    } catch (err) {
      set({
        isInitializing: false,
        initError: err instanceof Error ? err.message : "Failed to initialize app",
      });
    }
  },

  // --- Saving state ---

  isSaving: false,
  saveError: null,
  setSaveError: (msg) => set({ saveError: msg }),

  // --- Team Members ---

  members: [],
  addMember: (member) =>
    set((state) => ({ members: [...state.members, member] })),
  updateMember: (name, updates) =>
    set((state) => ({
      members: state.members.map((m) => (m.name === name ? { ...m, ...updates } : m)),
    })),
  removeMember: (name) =>
    set((state) => ({ members: state.members.filter((m) => m.name !== name) })),

  // --- Activities ---

  activities: [],
  activitiesDiagnostics: null,
  activityWriteWarning: null,
  clearActivityWriteWarning: () => set({ activityWriteWarning: null }),
  addActivity: (activity) => {
    set((state) => ({ activities: [activity, ...state.activities] }));
    recordActivity({
      projectId: activity.projectId,
      actionType: activity.actionType,
      description: activity.description,
      metadata: activity.metadata,
    }, (warning) => set({ activityWriteWarning: warning }));
  },

  // --- UI State ---

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

  // Add Project Dialog
  addProjectDialogOpen: false,
  setAddProjectDialogOpen: (open) => set({ addProjectDialogOpen: open }),
    }),
    {
      name: "kyro-nav-state",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        activeProjectId: state.activeProjectId,
        activeSidebarItem: state.activeSidebarItem,
        activeSprintId: state.activeSprintId,
        activeSprintDetailId: state.activeSprintDetailId,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
