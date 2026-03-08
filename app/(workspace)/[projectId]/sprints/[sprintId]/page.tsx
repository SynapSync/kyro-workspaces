"use client";

import { useParams } from "next/navigation";
import { SprintBoardPage } from "@/components/pages/sprint-board";

export default function Page() {
  const params = useParams<{ sprintId: string }>();
  return <SprintBoardPage sprintId={params.sprintId} />;
}
