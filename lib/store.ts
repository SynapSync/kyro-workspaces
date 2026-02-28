import { create } from "zustand";
import type {
  Project,
  AgentActivity,
  Task,
  TaskStatus,
  Sprint,
  SprintMarkdownSections,
  Document,
} from "./types";
import { mockProjects, mockActivities } from "./mock-data";

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

export const useAppStore = create<AppState>((set, get) => ({
  projects: mockProjects,
  activeProjectId: mockProjects[0].id,

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

  activities: mockActivities,
  addActivity: (activity) =>
    set((state) => ({ activities: [activity, ...state.activities] })),

  activeSidebarItem: "overview",
  setActiveSidebarItem: (item) => set({ activeSidebarItem: item }),
  activeSprintId: null,
  setActiveSprintId: (id) => set({ activeSprintId: id }),
  activeSprintDetailId: null,
  setActiveSprintDetailId: (id) => set({ activeSprintDetailId: id }),
}));
