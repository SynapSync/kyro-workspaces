import * as fs from "fs/promises";
import * as path from "path";
import { NextRequest } from "next/server";
import {
  getWorkspacePath,
  fileExists,
  ok,
  handleError,
} from "@/lib/api";

const REQUIRED_FILES = [
  ".kyro/config.json",
  ".kyro/members.json",
  "projects",
];

export async function GET(req: NextRequest) {
  try {
    const workspacePath = getWorkspacePath();
    const missing: string[] = [];

    for (const file of REQUIRED_FILES) {
      const fullPath = path.join(workspacePath, file);
      const exists = await fileExists(fullPath);
      if (!exists) {
        missing.push(file);
      }
    }

    const healthy = missing.length === 0;
    const status = healthy ? 200 : 206;

    return ok({ healthy, missing }, status);
  } catch (err) {
    return handleError(err);
  }
}
