"use client";

import { CheckSquare, Square } from "lucide-react";

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
    <div className="rounded-lg border bg-card p-4 space-y-2">
      {items.map((item, i) => {
        const isChecked = item.startsWith("[x]") || item.startsWith("[X]");
        const label = item.replace(/^\[[ xX~!>\-]\]\s*/, "").trim();

        return (
          <div key={i} className="flex items-start gap-2.5 py-1">
            {isChecked ? (
              <CheckSquare className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
            ) : (
              <Square className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
            )}
            <span className={`text-sm ${isChecked ? "text-muted-foreground line-through" : "text-foreground"}`}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
