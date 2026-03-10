"use client";

import { useRef, useEffect, useCallback } from "react";
import { GRAPH_NODE_HEX_COLORS } from "@/lib/config";
import type { GraphData, GraphNodeType } from "@/lib/types";

interface GraphMinimapProps {
  graph: GraphData;
  /** Current viewport bounds from the main graph: { x, y, width, height } in graph coordinates */
  viewport: { x: number; y: number; width: number; height: number } | null;
  /** Called when the user clicks on the minimap to pan the main graph */
  onPan: (x: number, y: number) => void;
  width?: number;
  height?: number;
}

/**
 * Minimap -- a scaled-down overview of the full graph.
 * Shows all nodes as colored dots with a viewport rectangle overlay.
 * Clicking on the minimap pans the main graph to that position.
 */
export function GraphMinimap({
  graph,
  viewport,
  onPan,
  width = 160,
  height = 120,
}: GraphMinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Compute the bounding box of all nodes
  const getBounds = useCallback(() => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const node of graph.nodes) {
      const x = (node as { x?: number }).x ?? 0;
      const y = (node as { y?: number }).y ?? 0;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    if (!isFinite(minX)) return { minX: 0, minY: 0, maxX: 100, maxY: 100 };
    // Add padding
    const padX = (maxX - minX) * 0.1 || 50;
    const padY = (maxY - minY) * 0.1 || 50;
    return { minX: minX - padX, minY: minY - padY, maxX: maxX + padX, maxY: maxY + padY };
  }, [graph.nodes]);

  // Render the minimap
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Background
    const isDark = document.documentElement.classList.contains("dark");
    ctx.fillStyle = isDark ? "rgba(15, 15, 20, 0.9)" : "rgba(250, 250, 252, 0.9)";
    ctx.fillRect(0, 0, width, height);

    const bounds = getBounds();
    const bw = bounds.maxX - bounds.minX || 1;
    const bh = bounds.maxY - bounds.minY || 1;
    const scaleX = width / bw;
    const scaleY = height / bh;
    const scale = Math.min(scaleX, scaleY);
    const offsetX = (width - bw * scale) / 2;
    const offsetY = (height - bh * scale) / 2;

    // Draw edges as thin lines
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = isDark ? "rgba(100, 100, 120, 0.3)" : "rgba(150, 150, 170, 0.3)";
    for (const edge of graph.edges) {
      const sourceNode = graph.nodes.find((n) => n.id === edge.source);
      const targetNode = graph.nodes.find((n) => n.id === edge.target);
      if (!sourceNode || !targetNode) continue;
      const sx = ((sourceNode as { x?: number }).x ?? 0 - bounds.minX) * scale + offsetX;
      const sy = ((sourceNode as { y?: number }).y ?? 0 - bounds.minY) * scale + offsetY;
      const tx = ((targetNode as { x?: number }).x ?? 0 - bounds.minX) * scale + offsetX;
      const ty = ((targetNode as { y?: number }).y ?? 0 - bounds.minY) * scale + offsetY;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
    }

    // Draw nodes as dots
    for (const node of graph.nodes) {
      const x = (((node as { x?: number }).x ?? 0) - bounds.minX) * scale + offsetX;
      const y = (((node as { y?: number }).y ?? 0) - bounds.minY) * scale + offsetY;
      const color = GRAPH_NODE_HEX_COLORS[node.fileType as GraphNodeType] ?? "#888";
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }

    // Draw viewport rectangle
    if (viewport) {
      const vx = (viewport.x - bounds.minX) * scale + offsetX;
      const vy = (viewport.y - bounds.minY) * scale + offsetY;
      const vw = viewport.width * scale;
      const vh = viewport.height * scale;
      ctx.strokeStyle = isDark ? "rgba(120, 160, 255, 0.6)" : "rgba(60, 100, 200, 0.5)";
      ctx.lineWidth = 1;
      ctx.strokeRect(vx, vy, vw, vh);
      ctx.fillStyle = isDark ? "rgba(120, 160, 255, 0.05)" : "rgba(60, 100, 200, 0.05)";
      ctx.fillRect(vx, vy, vw, vh);
    }
  }, [graph, viewport, width, height, getBounds]);

  // Handle click to pan
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const bounds = getBounds();
      const bw = bounds.maxX - bounds.minX || 1;
      const bh = bounds.maxY - bounds.minY || 1;
      const scaleX = width / bw;
      const scaleY = height / bh;
      const scale = Math.min(scaleX, scaleY);
      const offsetX = (width - bw * scale) / 2;
      const offsetY = (height - bh * scale) / 2;

      // Convert minimap click to graph coordinates
      const graphX = (clickX - offsetX) / scale + bounds.minX;
      const graphY = (clickY - offsetY) / scale + bounds.minY;
      onPan(graphX, graphY);
    },
    [getBounds, onPan, width, height]
  );

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={handleClick}
      className="absolute bottom-4 left-4 z-10 cursor-crosshair rounded-lg border shadow-md"
      style={{ width, height }}
      aria-label="Graph minimap -- click to navigate"
      role="img"
    />
  );
}
