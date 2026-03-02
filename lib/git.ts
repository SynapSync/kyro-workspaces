import simpleGit from "simple-git";
import { getWorkspacePath } from "@/lib/api";

export function getGit() {
  return simpleGit(getWorkspacePath());
}
