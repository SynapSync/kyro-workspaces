"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";

export function useRealtimeSync(): void {
  const refreshProject = useAppStore((s) => s.refreshProject);
  const loadGraph = useAppStore((s) => s.loadGraph);
  const reconnectAttempt = useRef(0);
  const graphDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxReconnectDelay = 30_000; // 30s max

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    function connect() {
      if (disposed) return;

      eventSource = new EventSource("/api/events");

      eventSource.addEventListener("connected", () => {
        reconnectAttempt.current = 0; // Reset backoff on successful connection
      });

      eventSource.addEventListener("index:updated", (event) => {
        try {
          const data = JSON.parse(event.data) as {
            projectId: string;
            files: string[];
          };
          refreshProject(data.projectId);

          // Debounce graph refresh (500ms) to avoid rapid successive re-fetches
          if (graphDebounceTimer.current) {
            clearTimeout(graphDebounceTimer.current);
          }
          graphDebounceTimer.current = setTimeout(() => {
            loadGraph(data.projectId);
            graphDebounceTimer.current = null;
          }, 500);
        } catch {
          // Ignore parse errors
        }
      });

      eventSource.onerror = () => {
        eventSource?.close();
        eventSource = null;

        if (disposed) return;

        // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s max
        const delay = Math.min(
          1000 * Math.pow(2, reconnectAttempt.current),
          maxReconnectDelay
        );
        reconnectAttempt.current++;
        reconnectTimer = setTimeout(connect, delay);
      };
    }

    connect();

    return () => {
      disposed = true;
      eventSource?.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (graphDebounceTimer.current) clearTimeout(graphDebounceTimer.current);
    };
  }, [refreshProject, loadGraph]);
}
