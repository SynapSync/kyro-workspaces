"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
  Plus,
} from "lucide-react";
import { NAV_ITEMS } from "@/lib/config";
import { currentUser } from "@/lib/auth";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Project } from "@/lib/types";

export function AppSidebar() {
  const isMobile = useIsMobile();
  const {
    projects,
    activeProjectId,
    setActiveProjectId,
    activeSidebarItem,
    setActiveSidebarItem,
    setActiveSprintId,
    addProject,
    sidebarCollapsed,
    setSidebarCollapsed,
    toggleSidebar,
  } = useAppStore();

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? projects[0];

  // Load persisted state on mount
  useEffect(() => {
    const saved = localStorage.getItem("kyro-sidebar-collapsed");
    if (saved !== null) {
      setSidebarCollapsed(JSON.parse(saved));
    } else if (isMobile) {
      setSidebarCollapsed(true);
    }
  }, [isMobile, setSidebarCollapsed]);

  // Persist state changes
  useEffect(() => {
    localStorage.setItem("kyro-sidebar-collapsed", JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Keyboard shortcut ⌘+B
  const handleToggleSidebar = useCallback(() => {
    toggleSidebar();
    toast(sidebarCollapsed ? "Sidebar expanded" : "Sidebar collapsed", {
      duration: 1500,
    });
  }, [toggleSidebar, sidebarCollapsed]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        handleToggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleToggleSidebar]);

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
    <TooltipPrimitive.Provider delayDuration={0}>
      <aside
        className={cn(
          "flex h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo & Toggle */}
        <div className="flex items-center gap-2.5 px-3 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shrink-0">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          {!sidebarCollapsed && (
            <span className="text-lg font-semibold tracking-tight text-sidebar-foreground">
              Clever
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "ml-auto h-7 w-7 shrink-0",
              sidebarCollapsed && "absolute left-12"
            )}
            onClick={toggleSidebar}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Project Switcher - Hidden when collapsed */}
        {!sidebarCollapsed && (
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
        )}

      {/* Navigation */}
      <ScrollArea className={cn("flex-1 px-3", sidebarCollapsed && "px-2")}>
        <nav className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSidebarItem === item.id;
            
            const navButton = (
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
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  sidebarCollapsed && "justify-center px-2"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
                {item.id === "agents" && !sidebarCollapsed && (
                  <Badge
                    variant="secondary"
                    className="ml-auto h-5 rounded-full px-1.5 text-[10px] font-semibold bg-primary/10 text-primary border-0"
                  >
                    AI
                  </Badge>
                )}
              </button>
            );

            if (sidebarCollapsed) {
              return (
                <TooltipPrimitive.Root key={item.id}>
                  <TooltipPrimitive.Trigger asChild>
                    {navButton}
                  </TooltipPrimitive.Trigger>
                  <TooltipPrimitive.Portal>
                    <TooltipPrimitive.Content
                      side="right"
                      sideOffset={5}
                      className="z-50 rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95"
                    >
                      {item.label}
                      <TooltipPrimitive.Arrow className="text-primary" />
                    </TooltipPrimitive.Content>
                  </TooltipPrimitive.Portal>
                </TooltipPrimitive.Root>
              );
            }

            return navButton;
          })}
        </nav>

        {/* Projects list under navigation - Hidden when collapsed */}
        {!sidebarCollapsed && (
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
        )}
      </ScrollArea>

      {/* User */}
      <div className="border-t border-sidebar-border p-3">
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-2 py-2",
            sidebarCollapsed && "justify-center px-0"
          )}
        >
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
              {currentUser.initials}
            </AvatarFallback>
          </Avatar>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {currentUser.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {currentUser.email}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
    </TooltipPrimitive.Provider>
  );
}
