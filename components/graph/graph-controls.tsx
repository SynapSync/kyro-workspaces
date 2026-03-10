"use client";

import { ZoomIn, ZoomOut, Maximize2, PinOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface GraphControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomToFit: () => void;
  onUnpinAll: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

const controlButtons = [
  { key: "zoom-in", icon: ZoomIn, label: "Zoom In", action: "onZoomIn" },
  { key: "zoom-out", icon: ZoomOut, label: "Zoom Out", action: "onZoomOut" },
  {
    key: "fit",
    icon: Maximize2,
    label: "Fit to View",
    action: "onZoomToFit",
  },
  {
    key: "unpin",
    icon: PinOff,
    label: "Unpin All Nodes",
    action: "onUnpinAll",
  },
] as const;

export function GraphControls({
  onZoomIn,
  onZoomOut,
  onZoomToFit,
  onUnpinAll,
  onRefresh,
  isRefreshing = false,
}: GraphControlsProps) {
  const actions: Record<string, () => void> = {
    onZoomIn,
    onZoomOut,
    onZoomToFit,
    onUnpinAll,
  };

  return (
    <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1 rounded-lg border bg-background/90 p-1 shadow-md backdrop-blur-sm">
      {controlButtons.map(({ key, icon: Icon, label, action }) => (
        <Tooltip key={key}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={actions[action]}
            >
              <Icon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">{label}</TooltipContent>
        </Tooltip>
      ))}

      <div className="mx-1 border-t" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={cn("h-4 w-4", isRefreshing && "animate-spin")}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Refresh Graph</TooltipContent>
      </Tooltip>
    </div>
  );
}
