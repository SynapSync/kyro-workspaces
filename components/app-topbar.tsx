"use client";

import { Search, Bell, Plus } from "lucide-react";
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
import { currentUser } from "@/lib/auth";

export function AppTopbar() {
  const members = useAppStore((s) => s.members);
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-6">
      {/* Left: team avatars */}
      <div className="flex items-center gap-2">
        <TooltipProvider delayDuration={200}>
          <div className="flex items-center -space-x-1.5">
            {members.map((member) => (
              <Tooltip key={member.name}>
                <TooltipTrigger asChild>
                  <Avatar className="h-7 w-7 border-2 border-card cursor-default">
                    <AvatarFallback
                      className={`${member.color} text-[10px] font-bold text-card`}
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

      {/* Right: actions */}
      <div className="flex items-center gap-2">
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
