import * as fs from "fs/promises";
import * as path from "path";
import { exec, spawn } from "child_process";
import { NextRequest, NextResponse } from "next/server";
import {
  getWorkspacePath,
  resolveProjectRoot,
  resolveProjectPath,
  handleError,
} from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      projectId?: string;
      prompt?: string;
      triggerCli?: boolean;
    };

    if (!body.projectId || !body.prompt) {
      return NextResponse.json(
        { error: "Missing 'projectId' or 'prompt' field" },
        { status: 400 },
      );
    }

    const workspacePath = getWorkspacePath();
    const projectRoot = await resolveProjectRoot(workspacePath, body.projectId);
    const promptPath = resolveProjectPath(projectRoot, "NEXT-SPRINT-PROMPT.md");

    await fs.writeFile(promptPath, body.prompt, "utf-8");

    const result: {
      written: boolean;
      path: string;
      triggered?: boolean;
      reason?: string;
    } = {
      written: true,
      path: promptPath,
    };

    // Optional CLI trigger
    if (body.triggerCli) {
      try {
        // Check if claude CLI exists
        const cliPath = await new Promise<string>((resolve, reject) => {
          exec("which claude", (err, stdout) => {
            if (err) reject(new Error("CLI not found"));
            else resolve(stdout.trim());
          });
        });

        // Spawn claude in background (non-blocking)
        const child = spawn(cliPath, ["-p", body.prompt], {
          cwd: projectRoot,
          detached: true,
          stdio: "ignore",
        });
        child.unref();

        result.triggered = true;
      } catch {
        result.triggered = false;
        result.reason = "Claude CLI not found. Install it from https://docs.anthropic.com/en/docs/claude-code";
      }
    }

    return NextResponse.json({ data: result });
  } catch (err) {
    return handleError(err);
  }
}
