"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Sidebar,
  Focus,
  EyeOff,
  Zap,
  CheckSquare,
  Search,
  AlertTriangle,
  FileText,
  Layers,
  Terminal,
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
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { NAV_ITEMS } from "@/lib/config";
import { cn } from "@/lib/utils";
import { useSearchIndex, groupByType, type SearchEntryType } from "@/lib/search";

type PaletteTab = "search" | "commands";

const TYPE_CONFIG: Record<
  SearchEntryType,
  { label: string; icon: typeof Zap }
> = {
  sprint: { label: "Sprints", icon: Zap },
  task: { label: "Tasks", icon: CheckSquare },
  finding: { label: "Findings", icon: Search },
  debt: { label: "Debt", icon: AlertTriangle },
  document: { label: "Documents", icon: FileText },
  phase: { label: "Phases", icon: Layers },
};

const SEARCH_GROUP_ORDER: SearchEntryType[] = [
  "sprint",
  "task",
  "finding",
  "debt",
  "document",
  "phase",
];

export function CommandPalette() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<PaletteTab>("search");

  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    toggleCommandPalette,
    activeProjectId,
    projects,
    findings,
    toggleFocusMode,
    zenMode,
    setZenMode,
    toggleSidebar,
    setAddProjectDialogOpen,
  } = useAppStore();

  const searchIndex = useSearchIndex(projects, findings);
  const grouped = useMemo(() => groupByType(searchIndex), [searchIndex]);

  // Reset tab when palette opens
  useEffect(() => {
    if (commandPaletteOpen) {
      setActiveTab("search");
    }
  }, [commandPaletteOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggleCommandPalette();
      }
      // ⌘J to toggle tab while palette is open
      if ((e.metaKey || e.ctrlKey) && e.key === "j" && commandPaletteOpen) {
        e.preventDefault();
        setActiveTab((t) => (t === "search" ? "commands" : "search"));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleCommandPalette, commandPaletteOpen]);

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

  const handleSearchResult = (navigateTo: string) => {
    router.push(navigateTo);
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
      {/* Toggle tab button — positioned next to the close (X) button */}
      <button
        type="button"
        onClick={() => setActiveTab(activeTab === "search" ? "commands" : "search")}
        className="absolute top-3 right-10 z-10 flex items-center gap-1.5 rounded-md bg-primary/10 px-1.5 py-1 text-primary transition-colors hover:bg-primary/20"
        aria-label={activeTab === "search" ? "Switch to commands" : "Switch to search"}
      >
        {activeTab === "search" ? (
          <Terminal className="h-3.5 w-3.5" />
        ) : (
          <Search className="h-3.5 w-3.5" />
        )}
        <kbd className="text-[10px] font-mono opacity-70">⌘J</kbd>
      </button>

      <CommandInput
        placeholder={
          activeTab === "search"
            ? "Search tasks, findings, sprints, debt..."
            : "Type a command..."
        }
      />

      {/* Tab switcher — hidden, toggle via icon button next to close */}
      <div className="hidden grid-cols-2 border-b">
        <button
          type="button"
          className={cn(
            "flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors",
            activeTab === "search"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setActiveTab("search")}
        >
          <Search className="h-3.5 w-3.5" />
          Search
        </button>
        <button
          type="button"
          className={cn(
            "flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors",
            activeTab === "commands"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setActiveTab("commands")}
        >
          <Terminal className="h-3.5 w-3.5" />
          Commands
        </button>
      </div>

      <CommandList>
        <CommandEmpty>
          {activeTab === "search" ? "No results found." : "No commands match."}
        </CommandEmpty>

        {activeTab === "search" && (
          <>
            {SEARCH_GROUP_ORDER.map((type) => {
              const entries = grouped[type];
              if (entries.length === 0) return null;
              const config = TYPE_CONFIG[type];
              const Icon = config.icon;
              return (
                <CommandGroup
                  key={type}
                  heading={
                    <span className="flex items-center gap-1.5">
                      <Icon className="h-3 w-3" />
                      {config.label}
                      <Badge
                        variant="secondary"
                        className="ml-1 h-4 rounded-full px-1.5 text-[10px] font-normal"
                      >
                        {entries.length}
                      </Badge>
                    </span>
                  }
                >
                  {entries.map((entry, i) => (
                    <CommandItem
                      key={`${type}-${entry.projectId}-${i}`}
                      value={`${entry.title} ${entry.description} ${Object.values(entry.metadata).join(" ")}`}
                      onSelect={() => handleSearchResult(entry.navigateTo)}
                    >
                      <Icon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="flex flex-col gap-0 min-w-0">
                        <span className="truncate text-sm">{entry.title}</span>
                        {entry.description && (
                          <span className="truncate text-xs text-muted-foreground">
                            {entry.description.slice(0, 80)}
                          </span>
                        )}
                      </div>
                      {projects.length > 1 && (
                        <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                          {entry.projectName}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
          </>
        )}

        {activeTab === "commands" && (
          <>
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
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
