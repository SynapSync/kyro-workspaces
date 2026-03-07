"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { Search, Bell, Plus, AlertTriangle, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { currentUser } from "@/lib/auth";
import { NAV_ITEMS } from "@/lib/config";

export function AppTopbar() {
  const pathname = usePathname();
  const {
    members,
    projects,
    activeProjectId,
    activityWriteWarning,
    clearActivityWriteWarning,
  } = useAppStore();

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? projects[0],
    [projects, activeProjectId]
  );

  // Derive sprint from URL: /[projectId]/sprints/[sprintId]/...
  const activeSprint = useMemo(() => {
    if (!activeProject) return null;
    const segments = pathname.split("/").filter(Boolean);
    // segments: [projectId, "sprints", sprintId, "detail"?]
    if (segments[1] === "sprints" && segments[2]) {
      return activeProject.sprints.find((s) => s.id === segments[2]) ?? null;
    }
    return null;
  }, [activeProject, pathname]);

  const breadcrumbs = useMemo(() => {
    const crumbs: string[] = [];
    if (activeProject) crumbs.push(activeProject.name);

    const segments = pathname.split("/").filter(Boolean);
    // segments[0] = projectId, segments[1] = section, segments[2] = sprintId, etc.
    const section = segments[1];
    const navItem = NAV_ITEMS.find((item) => item.id === section);
    if (navItem) crumbs.push(navItem.label);

    if (activeSprint) crumbs.push(activeSprint.name);

    // Check if it's the detail view
    if (segments.includes("detail")) crumbs.push("Details");

    return crumbs;
  }, [activeProject, pathname, activeSprint]);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-6">
      {/* Left: breadcrumb + team avatars */}
      <div className="flex items-center gap-4 min-w-0">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm min-w-0">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1 min-w-0">
              {i > 0 && <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/50" />}
              <span
                className={
                  i === breadcrumbs.length - 1
                    ? "font-medium text-foreground truncate"
                    : "text-muted-foreground truncate"
                }
              >
                {crumb}
              </span>
            </span>
          ))}
        </nav>

        {/* Team avatars */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <TooltipProvider delayDuration={200}>
            <div className="flex items-center -space-x-1.5">
              {members.map((member) => (
                <Tooltip key={member.name}>
                  <TooltipTrigger asChild>
                    <Avatar className="h-7 w-7 border-2 border-card cursor-default">
                      <AvatarFallback
                        className={cn(member.color, "text-[10px] font-bold text-card")}
                      >
                        {member.avatar}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{member.name}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 rounded-full"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="sr-only">Add team member</span>
          </Button>
        </div>
      </div>

      {/* Center: search */}
      <div className="flex-1 flex justify-center max-w-md mx-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks, docs, sprints..."
            className="h-9 w-full pl-9 bg-muted/50 border-transparent focus:border-border focus:bg-card"
          />
        </div>
      </div>

      {/* Agent Context */}
      <div className="hidden xl:flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-1.5 mr-3">
        <div className="text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground">Project:</span>{" "}
          {activeProject?.name ?? "—"}
        </div>
        <div className="text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground">Sprint:</span>{" "}
          {activeSprint?.name ?? "—"}
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        {activityWriteWarning ? (
          <div className="hidden md:flex items-center gap-1 rounded-md border border-amber-300/70 bg-amber-50 px-2 py-1 text-[11px] text-amber-900">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Activity log warning</span>
            <button
              type="button"
              aria-label="Dismiss activity warning"
              className="rounded p-0.5 hover:bg-amber-100"
              onClick={clearActivityWriteWarning}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : null}
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="sr-only">Notifications</span>
        </Button>
        <Avatar className="h-8 w-8 cursor-pointer">
          <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
            {currentUser.initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
