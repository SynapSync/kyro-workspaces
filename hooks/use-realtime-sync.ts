"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";

/**
 * Subscribe to SSE endpoint for real-time index updates.
 * When files change externally, triggers a store refresh for the affected project.
 * Includes reconnection with exponential backoff.
 */
export function useRealtimeSync(): void {
  const refreshProject = useAppStore((s) => s.refreshProject);
  const reconnectAttempt = useRef(0);
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
    };
  }, [refreshProject]);
}
