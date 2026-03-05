"use client";

import { Badge } from "@/components/ui/badge";
import type { DispositionEntry } from "@/lib/types";

const ACTION_STYLES: Record<string, { label: string; className: string }> = {
  incorporated: { label: "Incorporated", className: "bg-emerald-500/10 text-emerald-600" },
  deferred: { label: "Deferred", className: "bg-amber-500/10 text-amber-600" },
  resolved: { label: "Resolved", className: "bg-blue-500/10 text-blue-600" },
  "n/a": { label: "N/A", className: "bg-muted text-muted-foreground" },
  "converted-to-phase": { label: "Converted to Phase", className: "bg-purple-500/10 text-purple-600" },
};

interface DispositionTableProps {
  entries: DispositionEntry[];
}

export function DispositionTable({ entries }: DispositionTableProps) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No disposition entries.</p>
    );
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left font-semibold px-4 py-2.5 w-8">#</th>
            <th className="text-left font-semibold px-4 py-2.5">Recommendation</th>
            <th className="text-left font-semibold px-4 py-2.5 w-40">Action</th>
            <th className="text-left font-semibold px-4 py-2.5 w-36">Where</th>
            <th className="text-left font-semibold px-4 py-2.5">Justification</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const style = ACTION_STYLES[entry.action] ?? ACTION_STYLES["n/a"];
            return (
              <tr key={entry.number} className="border-b last:border-0">
                <td className="px-4 py-2.5 text-muted-foreground">{entry.number}</td>
                <td className="px-4 py-2.5">{entry.recommendation}</td>
                <td className="px-4 py-2.5">
                  <Badge variant="secondary" className={`text-[10px] h-5 border-0 ${style.className}`}>
                    {style.label}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground text-xs">{entry.where}</td>
                <td className="px-4 py-2.5 text-muted-foreground text-xs">{entry.justification}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
