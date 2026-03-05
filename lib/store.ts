import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Project,
  AgentActivity,
  AgentActionType,
  ActivitiesDiagnostics,
  Task,
  TaskStatus,
  Sprint,
  SprintMarkdownSections,
  Document,
  TeamMember,
  LoadingState,
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
  deleteSprint: (sprintId: string) => void;
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

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
  workspaceName: APP_NAME,
  projects: [],
  activeProjectId: "",

  setActiveProjectId: (id) =>
    set({ activeProjectId: id, activeSprintId: null, activeSprintDetailId: null, activeSidebarItem: "overview" }),

  addProject: (project) => {
    const prev = get().projects;
    set((state) => ({ isSaving: true, saveError: null, projects: [...state.projects, project] }));
    services.projects.createProject({
      id: project.id,
      name: project.name,
      description: project.description,
    })
      .then(() => set({ isSaving: false }))
      .catch((err) => set({ projects: prev, isSaving: false, saveError: errorMsg(err) }));
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
    services.projects.updateProject(id, {
      name: updates.name,
      description: updates.description,
      readme: updates.readme,
    })
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

  updateReadme: (content) => {
    const prev = get().projects;
    set((state) => ({
      isSaving: true,
      saveError: null,
      projects: state.projects.map((p) =>
        p.id === state.activeProjectId
          ? { ...p, readme: content, updatedAt: new Date().toISOString() }
          : p
      ),
    }));
    services.projects.updateProject(get().activeProjectId, { readme: content })
      .then(() => set({ isSaving: false }))
      .catch((err) => set({ projects: prev, isSaving: false, saveError: errorMsg(err) }));
  },

  // --- Documents (optimistic + rollback) ---

  addDocument: (doc) => {
    const prev = get().projects;
    set((state) => ({
      isSaving: true,
      saveError: null,
      projects: state.projects.map((p) =>
        p.id === state.activeProjectId
          ? { ...p, documents: [...p.documents, doc], updatedAt: new Date().toISOString() }
          : p
      ),
    }));
    services.projects.createDocument(get().activeProjectId, {
      title: doc.title,
      content: doc.content,
    })
      .then(() => set({ isSaving: false }))
      .catch((err) => set({ projects: prev, isSaving: false, saveError: errorMsg(err) }));
  },

  updateDocument: (id, updates) => {
    const projectId = get().activeProjectId;
    const prev = get().projects;
    set((state) => ({
      isSaving: true,
      saveError: null,
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
    }));
    services.projects.updateDocument(projectId, id, updates)
      .then(() => {
        set({ isSaving: false });
        recordActivity({
          projectId,
          actionType: "edited_doc",
          description: `Updated document ${updates.title ?? id}`,
          metadata: { docId: id, agent: "Kyro UI" },
        }, (warning) => set({ activityWriteWarning: warning }));
      })
      .catch((err) => set({ projects: prev, isSaving: false, saveError: errorMsg(err) }));
  },

  deleteDocument: (id) => {
    const prev = get().projects;
    set((state) => ({
      isSaving: true,
      saveError: null,
      projects: state.projects.map((p) =>
        p.id === state.activeProjectId
          ? { ...p, documents: p.documents.filter((d) => d.id !== id) }
          : p
      ),
    }));
    services.projects.deleteDocument(get().activeProjectId, id)
      .then(() => set({ isSaving: false }))
      .catch((err) => set({ projects: prev, isSaving: false, saveError: errorMsg(err) }));
  },

  // --- Sprints (optimistic + rollback) ---

  addSprint: (sprint) => {
    const projectId = get().activeProjectId;
    const prev = get().projects;
    set((state) => ({
      isSaving: true,
      saveError: null,
      projects: updateProjectSprints(
        state.projects,
        state.activeProjectId,
        (sprints) => [...sprints, sprint]
      ),
    }));
    services.projects.createSprint(projectId, {
      id: sprint.id,
      name: sprint.name,
      objective: sprint.objective,
      status: sprint.status,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      version: sprint.version,
    })
      .then(() => {
        set({ isSaving: false });
        recordActivity({
          projectId,
          actionType: "created_sprint",
          description: `Created sprint ${sprint.name}`,
          metadata: { sprintId: sprint.id, agent: "Kyro UI" },
        }, (warning) => set({ activityWriteWarning: warning }));
      })
      .catch((err) => set({ projects: prev, isSaving: false, saveError: errorMsg(err) }));
  },

  updateSprint: (id, updates) => {
    const prev = get().projects;
    set((state) => ({
      isSaving: true,
      saveError: null,
      projects: updateProjectSprints(
        state.projects,
        state.activeProjectId,
        (sprints) => sprints.map((s) => (s.id === id ? { ...s, ...updates } : s))
      ),
    }));
    services.projects.updateSprint(get().activeProjectId, id, updates)
      .then(() => set({ isSaving: false }))
      .catch((err) => set({ projects: prev, isSaving: false, saveError: errorMsg(err) }));
  },

  deleteSprint: (sprintId) => {
    const prev = get().projects;
    set((state) => ({
      isSaving: true,
      saveError: null,
      projects: updateProjectSprints(
        state.projects,
        state.activeProjectId,
        (sprints) => sprints.filter((s) => s.id !== sprintId)
      ),
    }));
    services.projects.deleteSprint(get().activeProjectId, sprintId)
      .then(() => set({ isSaving: false }))
      .catch((err) => set({ projects: prev, isSaving: false, saveError: errorMsg(err) }));
  },

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

  // --- Tasks (optimistic + rollback) ---

  addTask: (sprintId, task) => {
    const projectId = get().activeProjectId;
    const prev = get().projects;
    set((state) => ({
      isSaving: true,
      saveError: null,
      projects: updateProjectSprints(
        state.projects,
        state.activeProjectId,
        (sprints) =>
          sprints.map((s) =>
            s.id === sprintId ? { ...s, tasks: [...s.tasks, task] } : s
          )
      ),
    }));
    services.projects.createTask(projectId, sprintId, {
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignee: task.assignee,
      tags: task.tags,
    })
      .then(() => {
        set({ isSaving: false });
        recordActivity({
          projectId,
          actionType: "created_task",
          description: `Created task ${task.title}`,
          metadata: { sprintId, taskId: task.id, agent: "Kyro UI" },
        }, (warning) => set({ activityWriteWarning: warning }));
      })
      .catch((err) => set({ projects: prev, isSaving: false, saveError: errorMsg(err) }));
  },

  updateTask: (sprintId, taskId, updates) => {
    const prev = get().projects;
    set((state) => ({
      isSaving: true,
      saveError: null,
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
    }));
    services.projects.updateTask(get().activeProjectId, sprintId, taskId, updates)
      .then(() => set({ isSaving: false }))
      .catch((err) => set({ projects: prev, isSaving: false, saveError: errorMsg(err) }));
  },

  moveTask: (sprintId, taskId, newStatus) => {
    const projectId = get().activeProjectId;
    const prev = get().projects;
    set((state) => ({
      isSaving: true,
      saveError: null,
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
    }));
    services.projects.moveTask(projectId, sprintId, taskId, newStatus)
      .then(() => {
        set({ isSaving: false });
        const isDone = newStatus === "done";
        recordActivity({
          projectId,
          actionType: isDone ? "completed_task" : "moved_task",
          description: isDone
            ? `Completed task ${taskId}`
            : `Moved task ${taskId} to ${newStatus}`,
          metadata: { sprintId, taskId, status: newStatus, agent: "Kyro UI" },
        }, (warning) => set({ activityWriteWarning: warning }));
      })
      .catch((err) => set({ projects: prev, isSaving: false, saveError: errorMsg(err) }));
  },

  deleteTask: (sprintId, taskId) => {
    const prev = get().projects;
    set((state) => ({
      isSaving: true,
      saveError: null,
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
    }));
    services.projects.deleteTask(get().activeProjectId, sprintId, taskId)
      .then(() => set({ isSaving: false }))
      .catch((err) => set({ projects: prev, isSaving: false, saveError: errorMsg(err) }));
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
