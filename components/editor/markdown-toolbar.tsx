"use client";

import {
  Bold,
  Italic,
  Code,
  Link,
  Heading2,
  List,
  ListOrdered,
  Quote,
  FileCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface MarkdownToolbarProps {
  onAction: (format: string) => void;
  className?: string;
}

interface ToolItem {
  icon: React.ElementType;
  label: string;
  format: string;
  shortcut?: string;
}

const tools: ToolItem[] = [
  { icon: Bold, label: "Bold", format: "bold", shortcut: "⌘B" },
  { icon: Italic, label: "Italic", format: "italic", shortcut: "⌘I" },
  { icon: Code, label: "Inline Code", format: "code" },
  { icon: FileCode, label: "Code Block", format: "codeblock" },
  { icon: Link, label: "Link", format: "link", shortcut: "⌘K" },
  { icon: Heading2, label: "Heading", format: "heading" },
  { icon: List, label: "Bullet List", format: "list" },
  { icon: ListOrdered, label: "Numbered List", format: "numberedlist" },
  { icon: Quote, label: "Quote", format: "quote" },
];

export function MarkdownToolbar({ onAction, className }: MarkdownToolbarProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          "flex items-center gap-1 px-3 py-2 border-b bg-card",
          className
        )}
      >
        {tools.map((tool) => (
          <Tooltip key={tool.format}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onAction(tool.format)}
              >
                <tool.icon className="h-4 w-4" />
                <span className="sr-only">{tool.label}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {tool.label}
                {tool.shortcut && (
                  <span className="ml-2 text-muted-foreground">
                    {tool.shortcut}
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
