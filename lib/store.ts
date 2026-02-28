import { create } from "zustand";
import type {
  Project,
  AgentActivity,
  Task,
  TaskStatus,
  Sprint,
  Document,
} from "./types";
import { mockProject, mockActivities } from "./mock-data";

interface AppState {
  // Project
  project: Project;
  setProject: (project: Project) => void;

  // README
  updateReadme: (content: string) => void;

  // Documents
  addDocument: (doc: Document) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  deleteDocument: (id: string) => void;

  // Sprints
  addSprint: (sprint: Sprint) => void;
  updateSprint: (id: string, updates: Partial<Sprint>) => void;

  // Tasks
  addTask: (sprintId: string, task: Task) => void;
  updateTask: (sprintId: string, taskId: string, updates: Partial<Task>) => void;
  moveTask: (
    sprintId: string,
    taskId: string,
    newStatus: TaskStatus
  ) => void;
  deleteTask: (sprintId: string, taskId: string) => void;

  // Agent Activity
  activities: AgentActivity[];
  addActivity: (activity: AgentActivity) => void;

  // UI State
  activeSidebarItem: string;
  setActiveSidebarItem: (item: string) => void;
  activeSprintId: string | null;
  setActiveSprintId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  project: mockProject,
  setProject: (project) => set({ project }),

  updateReadme: (content) =>
    set((state) => ({
      project: { ...state.project, readme: content },
    })),

  addDocument: (doc) =>
    set((state) => ({
      project: {
        ...state.project,
        documents: [...state.project.documents, doc],
      },
    })),

  updateDocument: (id, updates) =>
    set((state) => ({
      project: {
        ...state.project,
        documents: state.project.documents.map((d) =>
          d.id === id
            ? { ...d, ...updates, updatedAt: new Date().toISOString() }
            : d
        ),
      },
    })),

  deleteDocument: (id) =>
    set((state) => ({
      project: {
        ...state.project,
        documents: state.project.documents.filter((d) => d.id !== id),
      },
    })),

  addSprint: (sprint) =>
    set((state) => ({
      project: {
        ...state.project,
        sprints: [...state.project.sprints, sprint],
      },
    })),

  updateSprint: (id, updates) =>
    set((state) => ({
      project: {
        ...state.project,
        sprints: state.project.sprints.map((s) =>
          s.id === id ? { ...s, ...updates } : s
        ),
      },
    })),

  addTask: (sprintId, task) =>
    set((state) => ({
      project: {
        ...state.project,
        sprints: state.project.sprints.map((s) =>
          s.id === sprintId ? { ...s, tasks: [...s.tasks, task] } : s
        ),
      },
    })),

  updateTask: (sprintId, taskId, updates) =>
    set((state) => ({
      project: {
        ...state.project,
        sprints: state.project.sprints.map((s) =>
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
      },
    })),

  moveTask: (sprintId, taskId, newStatus) =>
    set((state) => ({
      project: {
        ...state.project,
        sprints: state.project.sprints.map((s) =>
          s.id === sprintId
            ? {
                ...s,
                tasks: s.tasks.map((t) =>
                  t.id === taskId
                    ? {
                        ...t,
                        status: newStatus,
                        updatedAt: new Date().toISOString(),
                      }
                    : t
                ),
              }
            : s
        ),
      },
    })),

  deleteTask: (sprintId, taskId) =>
    set((state) => ({
      project: {
        ...state.project,
        sprints: state.project.sprints.map((s) =>
          s.id === sprintId
            ? { ...s, tasks: s.tasks.filter((t) => t.id !== taskId) }
            : s
        ),
      },
    })),

  activities: mockActivities,
  addActivity: (activity) =>
    set((state) => ({
      activities: [activity, ...state.activities],
    })),

  activeSidebarItem: "overview",
  setActiveSidebarItem: (item) => set({ activeSidebarItem: item }),
  activeSprintId: null,
  setActiveSprintId: (id) => set({ activeSprintId: id }),
}));
