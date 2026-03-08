"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { Providers } from "@/components/providers";
import { Loader2 } from "lucide-react";

function RootRedirect() {
  const router = useRouter();
  const { projects, isInitializing } = useAppStore();

  useEffect(() => {
    if (!isInitializing && projects.length > 0) {
      router.replace(`/${projects[0].id}/overview`);
    }
  }, [isInitializing, projects, router]);

  return (
    <div className="flex h-screen items-center justify-center text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}

export default function Home() {
  return (
    <Providers>
      <RootRedirect />
    </Providers>
  );
}
