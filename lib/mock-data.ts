import type { Project, AgentActivity, Task } from "./types";

const now = new Date().toISOString();
const hoursAgo = (h: number) =>
  new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
const daysAgo = (d: number) =>
  new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString();

const tasks: Task[] = [
  {
    id: "task-1",
    title: "Set up project repository and CI/CD pipeline",
    description:
      "Initialize the Git repo, configure GitHub Actions for continuous integration, and set up deployment workflows.",
    priority: "high",
    status: "done",
    assignee: "Alex Chen",
    tags: ["devops", "setup"],
    createdAt: daysAgo(14),
    updatedAt: daysAgo(10),
  },
  {
    id: "task-2",
    title: "Design system tokens and component library",
    description:
      "Define color palette, typography scale, spacing, and core UI components for the design system.",
    priority: "high",
    status: "done",
    assignee: "Maya Patel",
    tags: ["design", "frontend"],
    createdAt: daysAgo(12),
    updatedAt: daysAgo(7),
  },
  {
    id: "task-3",
    title: "Implement user authentication flow",
    description:
      "Build sign up, sign in, password reset, and email verification using Supabase Auth.",
    priority: "urgent",
    status: "review",
    assignee: "Alex Chen",
    tags: ["auth", "backend"],
    createdAt: daysAgo(10),
    updatedAt: hoursAgo(4),
  },
  {
    id: "task-4",
    title: "Build dashboard layout and navigation",
    description:
      "Create the main application shell with sidebar navigation, top bar, and responsive layout.",
    priority: "high",
    status: "in_progress",
    assignee: "Maya Patel",
    tags: ["frontend", "layout"],
    createdAt: daysAgo(8),
    updatedAt: hoursAgo(2),
  },
  {
    id: "task-5",
    title: "Create Kanban board with drag-and-drop",
    description:
      "Implement the sprint board view with draggable task cards across status columns.",
    priority: "high",
    status: "in_progress",
    assignee: "Jordan Liu",
    tags: ["frontend", "feature"],
    createdAt: daysAgo(6),
    updatedAt: hoursAgo(1),
  },
  {
    id: "task-6",
    title: "Integrate AI agent for task suggestions",
    description:
      "Connect the AI agent service that can auto-create tasks, suggest priorities, and summarize sprints.",
    priority: "medium",
    status: "todo",
    assignee: "Alex Chen",
    tags: ["ai", "backend"],
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
  },
  {
    id: "task-7",
    title: "Build markdown document editor",
    description:
      "Create a rich markdown editor with live preview for project documents and README.",
    priority: "medium",
    status: "todo",
    assignee: "Maya Patel",
    tags: ["frontend", "editor"],
    createdAt: daysAgo(4),
    updatedAt: daysAgo(4),
  },
  {
    id: "task-8",
    title: "Add real-time collaboration features",
    description:
      "Implement WebSocket connections for live updates when team members modify tasks or documents.",
    priority: "low",
    status: "backlog",
    assignee: undefined,
    tags: ["feature", "backend"],
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
  },
  {
    id: "task-9",
    title: "Create sprint analytics dashboard",
    description:
      "Build charts and metrics for sprint velocity, burndown, and team productivity.",
    priority: "low",
    status: "backlog",
    assignee: undefined,
    tags: ["analytics", "frontend"],
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  },
  {
    id: "task-10",
    title: "Set up automated testing suite",
    description:
      "Configure Jest and React Testing Library with tests for core components and API routes.",
    priority: "medium",
    status: "backlog",
    assignee: "Jordan Liu",
    tags: ["testing", "devops"],
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
  {
    id: "task-11",
    title: "Implement notification system",
    description:
      "Build in-app notifications for task assignments, mentions, and sprint updates.",
    priority: "medium",
    status: "todo",
    assignee: "Jordan Liu",
    tags: ["feature", "frontend"],
    createdAt: hoursAgo(20),
    updatedAt: hoursAgo(20),
  },
  {
    id: "task-12",
    title: "API rate limiting and security audit",
    description:
      "Add rate limiting to API endpoints and perform a security audit of the authentication system.",
    priority: "high",
    status: "todo",
    assignee: "Alex Chen",
    tags: ["security", "backend"],
    createdAt: hoursAgo(12),
    updatedAt: hoursAgo(12),
  },
];

export const mockProject: Project = {
  id: "proj-1",
  name: "Clever Platform",
  description:
    "An AI-native project management platform with intelligent task automation, smart sprint planning, and collaborative document editing.",
  readme: `# Clever Platform

Welcome to the **Clever Platform** - an AI-native project management tool built for modern development teams.

## Getting Started

1. Clone the repository
2. Install dependencies with \`pnpm install\`
3. Run the development server with \`pnpm dev\`

## Architecture

- **Frontend**: Next.js 16 with App Router
- **State Management**: Zustand
- **UI Components**: shadcn/ui + Radix
- **Drag & Drop**: dnd-kit
- **AI Integration**: Vercel AI SDK

## Features

- Kanban board with drag-and-drop
- Markdown document editor
- Sprint management
- AI-powered task suggestions
- Real-time collaboration

## Contributing

Please read our contribution guidelines before submitting a pull request.
`,
  documents: [
    {
      id: "doc-1",
      title: "Architecture Decision Records",
      content: `# Architecture Decision Records

## ADR-001: Use Next.js App Router

**Status**: Accepted

**Context**: We need a modern React framework that supports server components, streaming, and has excellent DX.

**Decision**: Use Next.js 16 with App Router for the frontend.

**Consequences**: 
- Better performance with server components
- Simplified data fetching
- Built-in routing and layouts
`,
      createdAt: daysAgo(14),
      updatedAt: daysAgo(7),
    },
    {
      id: "doc-2",
      title: "API Design Guidelines",
      content: `# API Design Guidelines

## REST Conventions

- Use plural nouns for endpoints: \`/api/tasks\`, \`/api/sprints\`
- Use HTTP methods appropriately: GET, POST, PUT, DELETE
- Return consistent error responses

## Response Format

\`\`\`json
{
  "data": {},
  "meta": {
    "total": 100,
    "page": 1
  }
}
\`\`\`

## Authentication

All API routes require a valid JWT token in the Authorization header.
`,
      createdAt: daysAgo(10),
      updatedAt: daysAgo(3),
    },
    {
      id: "doc-3",
      title: "Sprint Planning Guide",
      content: `# Sprint Planning Guide

## Before the Sprint

1. Review the product backlog
2. Identify high-priority items
3. Estimate task complexity

## During Planning

- Break epics into manageable tasks
- Assign owners to each task
- Set realistic sprint goals

## Definition of Done

- Code reviewed and approved
- Tests passing
- Documentation updated
- Deployed to staging
`,
      createdAt: daysAgo(5),
      updatedAt: daysAgo(1),
    },
  ],
  sprints: [
    {
      id: "sprint-1",
      name: "Foundation Sprint",
      status: "closed",
      startDate: daysAgo(14),
      endDate: daysAgo(7),
      tasks: tasks.filter((t) => ["task-1", "task-2"].includes(t.id)),
    },
    {
      id: "sprint-2",
      name: "Core Features Sprint",
      status: "active",
      startDate: daysAgo(7),
      endDate: daysAgo(-7),
      tasks: tasks.filter((t) =>
        [
          "task-3",
          "task-4",
          "task-5",
          "task-6",
          "task-7",
          "task-11",
          "task-12",
        ].includes(t.id)
      ),
    },
    {
      id: "sprint-3",
      name: "Polish & Scale Sprint",
      status: "planned",
      startDate: daysAgo(-7),
      endDate: daysAgo(-21),
      tasks: tasks.filter((t) =>
        ["task-8", "task-9", "task-10"].includes(t.id)
      ),
    },
  ],
};

export const mockActivities: AgentActivity[] = [
  {
    id: "act-1",
    actionType: "created_task",
    description:
      'AI Agent created task "API rate limiting and security audit" based on sprint goals',
    timestamp: hoursAgo(2),
  },
  {
    id: "act-2",
    actionType: "moved_task",
    description:
      'AI Agent moved "Implement user authentication flow" from In Progress to Review',
    timestamp: hoursAgo(4),
  },
  {
    id: "act-3",
    actionType: "edited_doc",
    description:
      "AI Agent updated Architecture Decision Records with ADR-002 for state management",
    timestamp: hoursAgo(8),
  },
  {
    id: "act-4",
    actionType: "completed_task",
    description:
      'AI Agent marked "Design system tokens and component library" as complete',
    timestamp: daysAgo(1),
  },
  {
    id: "act-5",
    actionType: "created_sprint",
    description:
      'AI Agent created "Polish & Scale Sprint" with 3 tasks from backlog',
    timestamp: daysAgo(2),
  },
  {
    id: "act-6",
    actionType: "created_task",
    description:
      'AI Agent created task "Set up automated testing suite" with medium priority',
    timestamp: daysAgo(2),
  },
  {
    id: "act-7",
    actionType: "moved_task",
    description:
      'AI Agent moved "Build dashboard layout and navigation" to In Progress',
    timestamp: daysAgo(3),
  },
  {
    id: "act-8",
    actionType: "edited_doc",
    description:
      "AI Agent revised Sprint Planning Guide with updated definition of done",
    timestamp: daysAgo(4),
  },
];

export const teamMembers = [
  { name: "Alex Chen", avatar: "AC", color: "bg-blue-500" },
  { name: "Maya Patel", avatar: "MP", color: "bg-emerald-500" },
  { name: "Jordan Liu", avatar: "JL", color: "bg-amber-500" },
];
