"use client";

import { Badge } from "@/components/ui/badge";
import { InlineMarkdown } from "@/components/inline-markdown";
import { FINDING_IMPACT_COLORS } from "@/lib/config";
import { cn } from "@/lib/utils";
import type { FindingsConsolidationEntry } from "@/lib/types";

interface FindingsConsolidationTableProps {
  entries: FindingsConsolidationEntry[];
}

export function FindingsConsolidationTable({ entries }: FindingsConsolidationTableProps) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No findings consolidated.</p>
    );
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left font-semibold px-4 py-2.5 w-8">#</th>
            <th className="text-left font-semibold px-4 py-2.5">Finding</th>
            <th className="text-left font-semibold px-4 py-2.5 w-32">Origin Phase</th>
            <th className="text-left font-semibold px-4 py-2.5 w-24">Impact</th>
            <th className="text-left font-semibold px-4 py-2.5">Action Taken</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.number} className="border-b last:border-0">
              <td className="px-4 py-2.5 text-muted-foreground">{entry.number}</td>
              <td className="px-4 py-2.5"><InlineMarkdown content={entry.finding} /></td>
              <td className="px-4 py-2.5 text-muted-foreground text-xs">{entry.originPhase}</td>
              <td className="px-4 py-2.5">
                <Badge variant="secondary" className={cn("text-[10px] h-5 border-0", FINDING_IMPACT_COLORS[entry.impact])}>
                  {entry.impact}
                </Badge>
              </td>
              <td className="px-4 py-2.5 text-muted-foreground text-xs"><InlineMarkdown content={entry.actionTaken} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
