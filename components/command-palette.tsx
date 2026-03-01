"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Zap,
  Bot,
  Plus,
  Sidebar,
  Focus,
  EyeOff,
  Search,
  FilePlus,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useAppStore } from "@/lib/store";
import type { Project, Document } from "@/lib/types";

export function CommandPalette() {
  const router = useRouter();
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    toggleCommandPalette,
    projects,
    activeProjectId,
    setActiveProjectId,
    setActiveSidebarItem,
    setActiveSprintId,
    addProject,
    addDocument,
    addSprint,
    toggleFocusMode,
    zenMode,
    setZenMode,
    sidebarCollapsed,
    toggleSidebar,
  } = useAppStore();

  const activeProject = projects.find((p) => p.id === activeProjectId);

  // Keyboard shortcut ⌘+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggleCommandPalette();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleCommandPalette]);

  const handleCreateProject = () => {
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: "New Project",
      description: "A new project",
      readme: "# New Project\n\nWelcome!",
      documents: [],
      sprints: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addProject(newProject);
    setActiveProjectId(newProject.id);
    setCommandPaletteOpen(false);
  };

  const handleCreateDocument = () => {
    if (!activeProject) return;
    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      title: "Untitled Document",
      content: "# New Document\n\nStart writing...",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addDocument(newDoc);
    setActiveSidebarItem("documents");
    setCommandPaletteOpen(false);
  };

  const handleCreateSprint = () => {
    if (!activeProject) return;
    const newSprint = {
      id: `sprint-${Date.now()}`,
      name: "Sprint " + (activeProject.sprints.length + 1),
      status: "planned" as const,
      tasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addSprint(newSprint);
    setActiveSidebarItem("sprints");
    setActiveSprintId(newSprint.id);
    setCommandPaletteOpen(false);
  };

  const handleNavigate = (item: string) => {
    setActiveSidebarItem(item);
    if (item !== "sprints") setActiveSprintId(null);
    setCommandPaletteOpen(false);
  };

  const handleToggleSidebar = () => {
    toggleSidebar();
    setCommandPaletteOpen(false);
  };

  const handleToggleFocusMode = () => {
    toggleFocusMode();
    setCommandPaletteOpen(false);
  };

  const handleToggleZenMode = () => {
    setZenMode(!zenMode);
    setCommandPaletteOpen(false);
  };

  return (
    <CommandDialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Actions">
          <CommandItem onSelect={handleCreateProject}>
            <Plus className="mr-2 h-4 w-4" />
            <span>Create New Project</span>
          </CommandItem>
          <CommandItem onSelect={handleCreateDocument}>
            <FilePlus className="mr-2 h-4 w-4" />
            <span>Create New Document</span>
          </CommandItem>
          <CommandItem onSelect={handleCreateSprint}>
            <Zap className="mr-2 h-4 w-4" />
            <span>Create New Sprint</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => handleNavigate("overview")}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Go to Overview</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate("readme")}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Go to README</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate("documents")}>
            <FolderOpen className="mr-2 h-4 w-4" />
            <span>Go to Documents</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate("sprints")}>
            <Zap className="mr-2 h-4 w-4" />
            <span>Go to Sprints</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate("agents")}>
            <Bot className="mr-2 h-4 w-4" />
            <span>Go to Agents Activity</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Board">
          <CommandItem onSelect={handleToggleSidebar}>
            <Sidebar className="mr-2 h-4 w-4" />
            <span>Toggle Sidebar</span>
            <span className="ml-auto text-muted-foreground text-xs">⌘B</span>
          </CommandItem>
          <CommandItem onSelect={handleToggleFocusMode}>
            <Focus className="mr-2 h-4 w-4" />
            <span>Toggle Focus Mode</span>
          </CommandItem>
          <CommandItem onSelect={handleToggleZenMode}>
            <EyeOff className="mr-2 h-4 w-4" />
            <span>Toggle Zen Mode</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
