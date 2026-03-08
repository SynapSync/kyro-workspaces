"use client";

import { InlineMarkdown } from "@/components/inline-markdown";
import { cn } from "@/lib/utils";

interface DoDChecklistProps {
  items: string[];
}

export function DoDChecklist({ items }: DoDChecklistProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No definition of done items.</p>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-1">
      {items.map((item, i) => {
        const isChecked = item.startsWith("[x]") || item.startsWith("[X]");
        const label = item.replace(/^\[[ xX~!>\-]\]\s*/, "").trim();

        return (
          <div key={i} className="flex items-start gap-2 py-1">
            <span className={cn("font-mono text-xs shrink-0 mt-0.5", isChecked ? "text-emerald-500" : "text-muted-foreground")}>
              {isChecked ? "[x]" : "[ ]"}
            </span>
            <InlineMarkdown
              content={label}
              className={cn("text-sm", isChecked ? "text-muted-foreground line-through" : "text-foreground")}
            />
          </div>
        );
      })}
    </div>
  );
}
