"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Sidebar,
  Focus,
  EyeOff,
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
import { NAV_ITEMS } from "@/lib/config";

export function CommandPalette() {
  const router = useRouter();
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    toggleCommandPalette,
    activeProjectId,
    toggleFocusMode,
    zenMode,
    setZenMode,
    toggleSidebar,
    setAddProjectDialogOpen,
  } = useAppStore();

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
    setCommandPaletteOpen(false);
    setAddProjectDialogOpen(true);
  };

  const handleNavigate = (item: string) => {
    const navItem = NAV_ITEMS.find((n) => n.id === item);
    if (navItem && activeProjectId) {
      router.push(`/${activeProjectId}${navItem.href}`);
    }
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
            <span>Add Project</span>
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
