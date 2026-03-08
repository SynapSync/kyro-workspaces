"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const { projects, activeProjectId, setActiveProjectId, isInitializing } = useAppStore();

  useEffect(() => {
    if (isInitializing || projects.length === 0) return;

    const project = projects.find((p) => p.id === params.projectId);
    if (!project) {
      // Invalid projectId — redirect to first project
      router.replace(`/${projects[0].id}/overview`);
      return;
    }

    if (activeProjectId !== params.projectId) {
      setActiveProjectId(params.projectId);
    }
  }, [params.projectId, projects, activeProjectId, setActiveProjectId, isInitializing, router]);

  return <>{children}</>;
}
