"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ProjectRoot() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/${params.projectId}/overview`);
  }, [params.projectId, router]);

  return null;
}
