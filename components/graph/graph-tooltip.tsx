"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { GRAPH_NODE_COLORS } from "@/lib/config";
import type { GraphNodeType } from "@/lib/types";

interface GraphTooltipProps {
  /** Node label */
  label: string;
  /** Node file type */
  fileType: GraphNodeType;
  /** Number of edges connected to this node */
  edgeCount: number;
  /** Node tags */
  tags: string[];
  /** Screen-space position for the tooltip */
  x: number;
  y: number;
  /** Whether to show the tooltip */
  visible: boolean;
  /** Container dimensions for positioning logic */
  containerWidth: number;
  /** Container height */
  containerHeight: number;
}

/**
 * React overlay tooltip for graph nodes.
 * Positioned via absolute coordinates relative to the graph container.
 * Replaces the previous Canvas-drawn tooltip for better accessibility
 * and consistent styling with the Kyro design system.
 */
export function GraphTooltip({
  label,
  fileType,
  edgeCount,
  tags,
  x,
  y,
  visible,
  containerWidth,
  containerHeight,
}: GraphTooltipProps) {
  const colorClass = GRAPH_NODE_COLORS[fileType] ?? "";
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipSize, setTooltipSize] = useState({ width: 0, height: 0 });
  const tagSignature = tags.join(",");

  useLayoutEffect(() => {
    const el = tooltipRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setTooltipSize({
      width: rect.width,
      height: rect.height,
    });
  }, [label, fileType, edgeCount, tagSignature, visible]);

  if (!visible) return null;

  const margin = 8;
  const estimatedWidth = tooltipSize.width || Math.min(240, Math.max(120, containerWidth - margin * 2));
  const estimatedHeight = tooltipSize.height || 120;
  const maxLeft = Math.max(margin, containerWidth - estimatedWidth - margin);
  const maxTop = Math.max(margin, containerHeight - estimatedHeight - margin);
  const clampedLeft = Math.min(Math.max(x + 12, margin), maxLeft);
  const clampedTop = Math.min(Math.max(y - 8, margin), maxTop);

  return (
    <div
      className="pointer-events-none absolute z-20 min-w-[140px] max-w-[240px] rounded-lg border bg-popover/95 px-3 py-2 shadow-lg backdrop-blur-sm"
      style={{
        left: clampedLeft,
        top: clampedTop,
      }}
      role="tooltip"
      aria-label={`${label}: ${fileType}, ${edgeCount} connections`}
      ref={tooltipRef}
    >
      <div className="text-sm font-semibold leading-tight text-foreground break-words">
        {label}
      </div>
      <div className="mt-1 flex items-center gap-2">
        <Badge variant="outline" className={`text-[10px] ${colorClass}`}>
          {fileType}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {edgeCount} connection{edgeCount !== 1 ? "s" : ""}
        </span>
      </div>
      {tags.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded bg-muted/60 px-1 py-0.5 text-[10px] text-muted-foreground"
            >
              {tag}
            </span>
          ))}
          {tags.length > 4 && (
            <span className="text-[10px] text-muted-foreground">
              +{tags.length - 4}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
