"use client";

import { Badge } from "@/components/ui/badge";
import { InlineMarkdown } from "@/components/inline-markdown";
import { DEBT_STATUS_STYLES } from "@/lib/config";
import { cn } from "@/lib/utils";
import type { DebtItem } from "@/lib/types";

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
            const style = DEBT_STATUS_STYLES[item.status] ?? DEBT_STATUS_STYLES["open"];
            return (
              <tr key={item.number} className="border-b last:border-0">
                <td className="px-4 py-2.5 text-muted-foreground">D{item.number}</td>
                <td className="px-4 py-2.5"><InlineMarkdown content={item.item} /></td>
                <td className="px-4 py-2.5 text-muted-foreground text-xs">{item.origin}</td>
                <td className="px-4 py-2.5 text-muted-foreground text-xs">{item.sprintTarget}</td>
                <td className="px-4 py-2.5">
                  <Badge variant="secondary" className={cn("text-[10px] h-5 border-0", style.className)}>
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
