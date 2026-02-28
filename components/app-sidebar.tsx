"use client";

import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Zap,
  Bot,
  ChevronDown,
  Sparkles,
  Check,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Project } from "@/lib/types";

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "readme", label: "README", icon: FileText },
  { id: "documents", label: "Documents", icon: FolderOpen },
  { id: "sprints", label: "Sprints", icon: Zap },
  { id: "agents", label: "Agents Activity", icon: Bot },
];

export function AppSidebar() {
  const {
    projects,
    activeProjectId,
    setActiveProjectId,
    activeSidebarItem,
    setActiveSidebarItem,
    setActiveSprintId,
    addProject,
  } = useAppStore();

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? projects[0];

  const handleCreateProject = () => {
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: "New Project",
      description: "A new project. Edit this description.",
      readme: "# New Project\n\nWelcome to your new project.",
      documents: [],
      sprints: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addProject(newProject);
    setActiveProjectId(newProject.id);
  };

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold tracking-tight text-sidebar-foreground">
          Clever
        </span>
      </div>

      {/* Project Switcher */}
      <div className="px-3 pb-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-card",
                  activeProject?.color ?? "bg-primary"
                )}
              >
                {activeProject?.name.charAt(0).toUpperCase()}
              </span>
              <span className="flex-1 text-left truncate">
                {activeProject?.name}
              </span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {projects.map((project) => (
              <DropdownMenuItem
                key={project.id}
                onClick={() => setActiveProjectId(project.id)}
                className="flex items-center gap-2"
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold text-card",
                    project.color ?? "bg-primary"
                  )}
                >
                  {project.name.charAt(0).toUpperCase()}
                </span>
                <span className="flex-1 truncate">{project.name}</span>
                {project.id === activeProjectId && (
                  <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleCreateProject}>
              <Plus className="mr-2 h-3.5 w-3.5" />
              Create Project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3">
        <nav className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSidebarItem === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSidebarItem(item.id);
                  if (item.id !== "sprints") setActiveSprintId(null);
                }}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                {item.id === "agents" && (
                  <Badge
                    variant="secondary"
                    className="ml-auto h-5 rounded-full px-1.5 text-[10px] font-semibold bg-primary/10 text-primary border-0"
                  >
                    AI
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>

        {/* Projects list under navigation */}
        <div className="mt-6 mb-2">
          <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Projects
          </p>
          <div className="flex flex-col gap-0.5">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => setActiveProjectId(project.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors",
                  project.id === activeProjectId
                    ? "text-sidebar-foreground font-medium"
                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full shrink-0",
                    project.color ?? "bg-primary"
                  )}
                />
                <span className="truncate">{project.name}</span>
                <span className="ml-auto text-[10px] text-muted-foreground">
                  {project.sprints.length}
                </span>
              </button>
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* User */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
              TC
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              Tahlia Chen
            </p>
            <p className="text-xs text-muted-foreground truncate">
              tahlia@clever.dev
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
