"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect, type ReactNode } from "react";
import { useAppStore } from "@/lib/store";
import { QUERY_STALE_TIME_MS } from "@/lib/config";

function AppInitializer() {
  const initializeApp = useAppStore((s) => s.initializeApp);
  useEffect(() => {
    initializeApp();
  }, [initializeApp]);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: QUERY_STALE_TIME_MS,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AppInitializer />
      {children}
    </QueryClientProvider>
  );
}
