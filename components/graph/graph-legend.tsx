"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GRAPH_NODE_HEX_COLORS, GRAPH_EDGE_STYLES } from "@/lib/config";
import type { GraphNodeType, GraphEdgeType } from "@/lib/types";
import type { GraphFilterState } from "./graph-filters";

const NODE_TYPE_LABELS: Record<GraphNodeType, string> = {
  sprint: "Sprint",
  finding: "Finding",
  document: "Document",
  readme: "README",
  roadmap: "Roadmap",
};

interface GraphLegendProps {
  filterState?: GraphFilterState;
}

export function GraphLegend({ filterState }: GraphLegendProps) {
  const [expanded, setExpanded] = useState(true);

  const nodeTypes = Object.entries(GRAPH_NODE_HEX_COLORS) as [
    GraphNodeType,
    string,
  ][];

  const edgeTypes = Object.entries(GRAPH_EDGE_STYLES) as [
    GraphEdgeType,
    { color: string; dashArray: string; label: string },
  ][];

  const hasActiveFilters =
    filterState &&
    (filterState.hiddenTypes.size > 0 ||
      filterState.selectedTags.length > 0 ||
      filterState.searchQuery.length > 0);

  return (
    <div className="absolute top-4 right-4 z-10 w-44 rounded-lg border bg-background/90 shadow-md backdrop-blur-sm">
      <Button
        variant="ghost"
        size="sm"
        className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground"
        onClick={() => setExpanded(!expanded)}
      >
        <span>
          Legend
          {hasActiveFilters && (
            <span className="ml-1 text-[10px] text-primary">(filtered)</span>
          )}
        </span>
        {expanded ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </Button>

      {expanded && (
        <div className="space-y-3 px-3 pb-3">
          {/* Node types */}
          <div>
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Nodes
            </div>
            <div className="space-y-1">
              {nodeTypes.map(([type, color]) => {
                const isHidden = filterState?.hiddenTypes.has(type) ?? false;
                return (
                  <div
                    key={type}
                    className="flex items-center gap-2"
                    style={{ opacity: isHidden ? 0.3 : 1 }}
                  >
                    <span
                      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs text-foreground">
                      {NODE_TYPE_LABELS[type]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Edge types */}
          <div>
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Edges
            </div>
            <div className="space-y-1">
              {edgeTypes.map(([type, style]) => (
                <div key={type} className="flex items-center gap-2">
                  <svg
                    width="16"
                    height="8"
                    className="shrink-0"
                    viewBox="0 0 16 8"
                  >
                    <line
                      x1="0"
                      y1="4"
                      x2="16"
                      y2="4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeDasharray={
                        style.dashArray !== "none" ? style.dashArray : undefined
                      }
                      className="text-foreground/60"
                    />
                  </svg>
                  <span className="text-xs text-foreground">{style.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
