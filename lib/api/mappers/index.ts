// Mappers — transform API DTOs into domain types used by the store and components.
// Each function is a pure transformation: no side effects, no API calls.

import type {
  Project,
  Task,
  Sprint,
  Document,
  TeamMember,
  AgentActivity,
  SprintMarkdownSections,
} from "@/lib/types";
import type {
  ProjectDTO,
  TaskDTO,
  SprintDTO,
  DocumentDTO,
  TeamMemberDTO,
  AgentActivityDTO,
} from "@/lib/api/types";

export function taskFromDTO(dto: TaskDTO): Task {
  return {
    id: dto._id,
    title: dto.title,
    description: dto.description,
    priority: dto.priority as Task["priority"],
    status: dto.status as Task["status"],
    assignee: dto.assigned_to,
    tags: dto.tags,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

export function sprintFromDTO(dto: SprintDTO): Sprint {
  const sections: SprintMarkdownSections | undefined = dto.sections
    ? {
        sprintObjective: dto.sections.sprint_objective,
        disposition: dto.sections.disposition,
        phases: dto.sections.phases,
        emergentPhases: dto.sections.emergent_phases,
        findingsConsolidation: dto.sections.findings_consolidation,
        technicalDebt: dto.sections.technical_debt,
        definitionOfDone: dto.sections.definition_of_done,
        retrospective: dto.sections.retrospective,
        recommendations: dto.sections.recommendations,
      }
    : undefined;

  return {
    id: dto._id,
    name: dto.name,
    status: dto.status as Sprint["status"],
    startDate: dto.start_date,
    endDate: dto.end_date,
    version: dto.version,
    objective: dto.objective,
    tasks: dto.tasks.map(taskFromDTO),
    sections,
  };
}

export function documentFromDTO(dto: DocumentDTO): Document {
  return {
    id: dto._id,
    title: dto.title,
    content: dto.content,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

export function projectFromDTO(dto: ProjectDTO): Project {
  return {
    id: dto._id,
    name: dto.name,
    description: dto.description,
    color: dto.color,
    readme: dto.readme,
    documents: dto.documents.map(documentFromDTO),
    sprints: dto.sprints.map(sprintFromDTO),
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

export function memberFromDTO(dto: TeamMemberDTO): TeamMember {
  return {
    id: dto._id,
    name: dto.name,
    avatar: dto.avatar,
    color: dto.color,
  };
}

export function activityFromDTO(dto: AgentActivityDTO): AgentActivity {
  return {
    id: dto._id,
    projectId: dto.project_id,
    actionType: dto.action_type as AgentActivity["actionType"],
    description: dto.description,
    timestamp: dto.timestamp,
    metadata: dto.metadata,
  };
}
