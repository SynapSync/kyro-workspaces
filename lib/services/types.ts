import type { Project, TeamMember, AgentActivity } from "@/lib/types";

// --- Service Interfaces ---
// These contracts must be implemented by both mock and real (API) services.
// All methods are async to ensure API implementations can be swapped in without
// changing the store or components.

export interface ProjectsService {
  list(): Promise<Project[]>;
}

export interface MembersService {
  list(): Promise<TeamMember[]>;
}

export interface ActivitiesService {
  list(): Promise<AgentActivity[]>;
}

// Registry type used by the service factory
export interface AppServices {
  projects: ProjectsService;
  members: MembersService;
  activities: ActivitiesService;
}
