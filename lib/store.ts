import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Project,
  TaskStatus,
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
  addProject: (path: string, name?: string, color?: string) => Promise<void>;
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

  // Re-entry Prompts (per-project, loaded on demand)
  reentryPrompts: Record<string, string>;
  reentryLoading: Record<string, boolean>;
  loadReentryPrompts: (projectId: string) => Promise<void>;

  // Task Mutations
  updatingTasks: Record<string, boolean>; // taskId -> isUpdating
  updateTaskStatus: (projectId: string, sprintId: string, taskId: string, newStatus: TaskStatus) => void;
  updateTask: (projectId: string, sprintId: string, taskId: string, updates: { title?: string; status?: TaskStatus }) => void;
  refreshProject: (projectId: string) => Promise<void>;

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

  // Agent Activity
  activities: AgentActivity[];
  activitiesDiagnostics: ActivitiesDiagnostics | null;
  addActivity: (activity: AgentActivity) => void;
  activityWriteWarning: string | null;
  clearActivityWriteWarning: () => void;

  // Sidebar State
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;

  // Column Collapse State (per sprint)
  collapsedColumns: Record<string, boolean>;
  setColumnCollapsed: (sprintId: string, columnId: string, collapsed: boolean) => void;
  toggleColumnCollapsed: (sprintId: string, columnId: string) => void;

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

  setActiveProjectId: (id) => set({ activeProjectId: id }),

  addProject: async (path, name, color) => {
    set({ isSaving: true, saveError: null });
    try {
      const entry = await services.projects.createProject({ path, name, color });
      const project = (await services.projects.getProject(entry.id)) ?? entry;
      set((state) => ({
        projects: [...state.projects, project],
        activeProjectId: project.id,
        isSaving: false,
      }));
    } catch (err) {
      set({ isSaving: false, saveError: errorMsg(err) });
      throw err;
    }
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
    const deletedProject = prev.find((p) => p.id === id);
    services.projects.deleteProject(id)
      .then(() => {
        set({ isSaving: false });
        if (deletedProject) {
          recordActivity({
            projectId: id,
            actionType: "removed_project",
            description: `Removed project "${deletedProject.name}"`,
          }, (warning) => set({ activityWriteWarning: warning }));
        }
      })
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

  // --- Re-entry Prompts ---

  reentryPrompts: {},
  reentryLoading: {},
  loadReentryPrompts: async (projectId) => {
    set((state) => ({
      reentryLoading: { ...state.reentryLoading, [projectId]: true },
    }));
    try {
      const content = await services.projects.getReentryPrompts(projectId);
      set((state) => ({
        reentryPrompts: { ...state.reentryPrompts, [projectId]: content },
        reentryLoading: { ...state.reentryLoading, [projectId]: false },
      }));
    } catch (err) {
      set((state) => ({
        reentryLoading: { ...state.reentryLoading, [projectId]: false },
      }));
      console.warn("[reentry] Failed to load:", errorMsg(err));
    }
  },

  // --- Task Mutations ---

  updatingTasks: {},

  updateTaskStatus: (projectId, sprintId, taskId, newStatus) => {
    const prev = get().projects;
    const project = prev.find((p) => p.id === projectId);
    if (!project) return;
    const sprint = project.sprints.find((s) => s.id === sprintId);
    if (!sprint) return;
    const task = sprint.tasks.find((t) => t.id === taskId);
    if (!task) return;

    const oldStatus = task.status;
    if (oldStatus === newStatus) return;

    set((state) => ({
      updatingTasks: { ...state.updatingTasks, [taskId]: true },
      projects: state.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              sprints: p.sprints.map((s) =>
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
              ),
            }
          : p
      ),
    }));

    services.projects
      .updateTaskStatus(projectId, sprintId, taskId, newStatus)
      .then(() => {
        set((state) => ({
          updatingTasks: { ...state.updatingTasks, [taskId]: false },
        }));
        recordActivity({
          projectId,
          actionType: "moved_task",
          description: `Moved task "${task.title}" from ${oldStatus} to ${newStatus}`,
          metadata: { taskId, sprintId, from: oldStatus, to: newStatus },
        }, (warning) => set({ activityWriteWarning: warning }));
      })
      .catch((err) => {
        set((state) => ({
          projects: prev,
          updatingTasks: { ...state.updatingTasks, [taskId]: false },
          saveError: errorMsg(err),
        }));
      });
  },

  updateTask: (projectId, sprintId, taskId, updates) => {
    const prev = get().projects;
    const project = prev.find((p) => p.id === projectId);
    if (!project) return;
    const sprint = project.sprints.find((s) => s.id === sprintId);
    if (!sprint) return;
    const task = sprint.tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Optimistic update
    set((state) => ({
      updatingTasks: { ...state.updatingTasks, [taskId]: true },
      projects: state.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              sprints: p.sprints.map((s) =>
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
              ),
            }
          : p
      ),
    }));

    services.projects
      .updateTask(projectId, sprintId, taskId, updates)
      .then(() => {
        set((state) => ({
          updatingTasks: { ...state.updatingTasks, [taskId]: false },
        }));
      })
      .catch((err) => {
        set((state) => ({
          projects: prev,
          updatingTasks: { ...state.updatingTasks, [taskId]: false },
          saveError: errorMsg(err),
        }));
      });
  },

  refreshProject: async (projectId) => {
    // Skip refresh while tasks are being written — avoids overwriting optimistic updates
    const hasPendingWrites = Object.values(get().updatingTasks).some(Boolean);
    if (hasPendingWrites) return;

    try {
      const project = await services.projects.getProject(projectId);
      if (!project) return;
      set((state) => ({
        projects: state.projects.map((p) => (p.id === projectId ? project : p)),
      }));
    } catch {
      // Refresh is best-effort — failures are non-critical
    }
  },

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

  // Command Palette
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

  // Add Project Dialog
  addProjectDialogOpen: false,
  setAddProjectDialogOpen: (open) => set({ addProjectDialogOpen: open }),
    }),
    {
      name: "kyro-ui-state",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        activeProjectId: state.activeProjectId,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
