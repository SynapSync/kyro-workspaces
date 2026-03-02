import * as fs from "fs/promises";
import * as path from "path";
import { NextRequest } from "next/server";
import {
  getWorkspacePath,
  fileExists,
  WorkspaceError,
  ok,
  handleError,
} from "@/lib/api";
import {
  parseWorkspaceConfig,
} from "@/lib/file-format/parsers";

export async function GET(req: NextRequest) {
  try {
    const workspacePath = getWorkspacePath();

    const configPath = path.join(workspacePath, ".kyro", "config.json");
    const configExists = await fileExists(configPath);

    if (!configExists) {
      return ok({ needsInit: true }, 404);
    }

    const configContent = await fs.readFile(configPath, "utf-8");
    const workspace = parseWorkspaceConfig(configContent, workspacePath);

    return ok({ workspace }, 200);
  } catch (err) {
    if (err instanceof WorkspaceError && err.code === "WORKSPACE_NOT_CONFIGURED") {
      return ok({ needsOnboarding: true }, 503);
    }
    return handleError(err);
  }
}
