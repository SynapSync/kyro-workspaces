"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Zap,
  Plus,
  Sidebar,
  Focus,
  EyeOff,
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
import { NAV_ITEMS, DEFAULT_PROJECT, DEFAULT_DOCUMENT, DEFAULT_SPRINT_NAME_PREFIX } from "@/lib/config";
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
      name: DEFAULT_PROJECT.name,
      description: DEFAULT_PROJECT.description,
      readme: DEFAULT_PROJECT.readme,
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
      title: DEFAULT_DOCUMENT.title,
      content: DEFAULT_DOCUMENT.content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addDocument(newDoc);
    setActiveSidebarItem("documents"); // NAV_ITEMS id
    setCommandPaletteOpen(false);
  };

  const handleCreateSprint = () => {
    if (!activeProject) return;
    const newSprint = {
      id: `sprint-${Date.now()}`,
      name: `${DEFAULT_SPRINT_NAME_PREFIX} ${activeProject.sprints.length + 1}`,
      status: "planned" as const,
      tasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addSprint(newSprint);
    setActiveSidebarItem("sprints"); // NAV_ITEMS id
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
          {NAV_ITEMS.map((item) => (
            <CommandItem key={item.id} onSelect={() => handleNavigate(item.id)}>
              <item.icon className="mr-2 h-4 w-4" />
              <span>Go to {item.label}</span>
            </CommandItem>
          ))}
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
