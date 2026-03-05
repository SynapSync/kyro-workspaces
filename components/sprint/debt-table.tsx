"use client";

import { Badge } from "@/components/ui/badge";
import type { DebtItem } from "@/lib/types";

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-red-500/10 text-red-600" },
  "in-progress": { label: "In Progress", className: "bg-amber-500/10 text-amber-600" },
  resolved: { label: "Resolved", className: "bg-emerald-500/10 text-emerald-600" },
  deferred: { label: "Deferred", className: "bg-muted text-muted-foreground" },
  "carry-over": { label: "Carry-over", className: "bg-blue-500/10 text-blue-600" },
};

interface DebtTableProps {
  items: DebtItem[];
}

export function DebtTable({ items }: DebtTableProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No debt items tracked.</p>
    );
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left font-semibold px-4 py-2.5 w-8">#</th>
            <th className="text-left font-semibold px-4 py-2.5">Item</th>
            <th className="text-left font-semibold px-4 py-2.5 w-36">Origin</th>
            <th className="text-left font-semibold px-4 py-2.5 w-28">Target</th>
            <th className="text-left font-semibold px-4 py-2.5 w-28">Status</th>
            <th className="text-left font-semibold px-4 py-2.5 w-28">Resolved In</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const style = STATUS_STYLES[item.status] ?? STATUS_STYLES["open"];
            return (
              <tr key={item.number} className="border-b last:border-0">
                <td className="px-4 py-2.5 text-muted-foreground">D{item.number}</td>
                <td className="px-4 py-2.5">{item.item}</td>
                <td className="px-4 py-2.5 text-muted-foreground text-xs">{item.origin}</td>
                <td className="px-4 py-2.5 text-muted-foreground text-xs">{item.sprintTarget}</td>
                <td className="px-4 py-2.5">
                  <Badge variant="secondary" className={`text-[10px] h-5 border-0 ${style.className}`}>
                    {style.label}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground text-xs">
                  {item.resolvedIn ?? "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
