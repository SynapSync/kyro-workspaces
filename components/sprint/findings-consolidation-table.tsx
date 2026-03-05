"use client";

import { Badge } from "@/components/ui/badge";
import type { FindingsConsolidationEntry } from "@/lib/types";

const IMPACT_STYLES: Record<string, string> = {
  high: "bg-red-500/10 text-red-600",
  medium: "bg-amber-500/10 text-amber-600",
  low: "bg-blue-500/10 text-blue-600",
};

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
              <td className="px-4 py-2.5">{entry.finding}</td>
              <td className="px-4 py-2.5 text-muted-foreground text-xs">{entry.originPhase}</td>
              <td className="px-4 py-2.5">
                <Badge variant="secondary" className={`text-[10px] h-5 border-0 ${IMPACT_STYLES[entry.impact] ?? ""}`}>
                  {entry.impact}
                </Badge>
              </td>
              <td className="px-4 py-2.5 text-muted-foreground text-xs">{entry.actionTaken}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
