// API DTOs — speculative shapes based on common REST conventions.
// These will be adjusted once the real backend defines its contract.
//
// Convention used here: snake_case fields, `_id` for MongoDB ObjectId.
// If the backend uses a different convention, update the DTOs and mappers together.

export interface TaskDTO {
  _id: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  assigned_to?: string;
  tags: string[];
  sprint_id: string;
  created_at: string;
  updated_at: string;
}

export interface SprintDTO {
  _id: string;
  name: string;
  status: string;
  start_date?: string;
  end_date?: string;
  version?: string;
  objective?: string;
  tasks: TaskDTO[];
  sections?: {
    retrospective?: string;
    technical_debt?: string;
    execution_metrics?: string;
    findings?: string;
    recommendations?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface DocumentDTO {
  _id: string;
  title: string;
  content: string;
  project_id: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectDTO {
  _id: string;
  name: string;
  description: string;
  color?: string;
  readme: string;
  documents: DocumentDTO[];
  sprints: SprintDTO[];
  created_at: string;
  updated_at: string;
}

export interface TeamMemberDTO {
  _id: string;
  name: string;
  avatar: string;
  color: string;
  email?: string;
}

export interface AgentActivityDTO {
  _id: string;
  project_id: string;
  action_type: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, string>;
}
