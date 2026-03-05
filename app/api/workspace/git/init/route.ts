import * as fs from "fs";
import * as path from "path";
import { getGit } from "@/lib/git";
import { getWorkspacePath, ok, handleError } from "@/lib/api";

export async function POST() {
  try {
    const git = getGit();
    const workspacePath = getWorkspacePath();
    const gitDir = path.join(workspacePath, ".git");

    if (fs.existsSync(gitDir)) {
      return ok({ message: "already initialized", alreadyInitialized: true });
    }

    await git.init();
    await git.add(".");
    try {
      await git.commit("chore: initialize kyro workspace");
    } catch {
      // Nothing to commit is OK
    }

    return ok({ message: "initialized", alreadyInitialized: false });
  } catch (err) {
    return handleError(err);
  }
}
