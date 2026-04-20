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

const MAX_PROMPT_BYTES = 50 * 1024; // 50 KB

/**
 * Validate prompt content — reject null bytes, control characters (except \n \t),
 * and prompts exceeding the size limit.
 */
function validatePrompt(prompt: string): string | null {
  if (Buffer.byteLength(prompt, "utf-8") > MAX_PROMPT_BYTES) {
    return `Prompt exceeds maximum size (${MAX_PROMPT_BYTES / 1024} KB)`;
  }
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(prompt)) {
    return "Prompt contains invalid control characters";
  }
  return null;
}

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

    const validationError = validatePrompt(body.prompt);
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
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

    // Optional CLI trigger — pass file path instead of raw prompt (D4 sanitization)
    if (body.triggerCli) {
      try {
        // Check if claude CLI exists
        const cliPath = await new Promise<string>((resolve, reject) => {
          exec("which claude", (err, stdout) => {
            if (err) reject(new Error("CLI not found"));
            else resolve(stdout.trim());
          });
        });

        // Spawn claude with stdin pipe — prompt read from file, not passed as arg (D4)
        const promptContent = await fs.readFile(promptPath, "utf-8");
        const child = spawn(cliPath, ["-p", "-"], {
          cwd: projectRoot,
          detached: true,
          stdio: ["pipe", "ignore", "ignore"],
        });
        child.stdin?.write(promptContent);
        child.stdin?.end();
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
