"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";

export default function WorkspaceRoot() {
  const router = useRouter();
  const { projects, isInitializing } = useAppStore();

  useEffect(() => {
    if (!isInitializing && projects.length > 0) {
      router.replace(`/${projects[0].id}/overview`);
    }
  }, [isInitializing, projects, router]);

  return null;
}
