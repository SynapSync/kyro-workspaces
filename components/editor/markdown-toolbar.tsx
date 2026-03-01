"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { MARKDOWN_TOOLBAR_ITEMS } from "@/lib/config";

interface MarkdownToolbarProps {
  onAction: (format: string) => void;
  className?: string;
}

export function MarkdownToolbar({ onAction, className }: MarkdownToolbarProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          "flex items-center gap-1 px-3 py-2 border-b bg-card",
          className
        )}
      >
        {MARKDOWN_TOOLBAR_ITEMS.map((item) => (
          <Tooltip key={item.format}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onAction(item.format)}
              >
                <item.icon className="h-4 w-4" />
                <span className="sr-only">{item.label}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {item.label}
                {item.shortcut && (
                  <span className="ml-2 text-muted-foreground">
                    {item.shortcut}
                  </span>
                )}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
