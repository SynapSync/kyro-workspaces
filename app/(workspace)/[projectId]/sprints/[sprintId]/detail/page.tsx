"use client";

import { useParams } from "next/navigation";
import { SprintDetailPage } from "@/components/pages/sprint-detail-page";

export default function Page() {
  const params = useParams<{ sprintId: string }>();
  return <SprintDetailPage sprintId={params.sprintId} />;
}
