import { NextRequest } from "next/server";
import { getGit } from "@/lib/git";
import { ok, handleError, validateBody } from "@/lib/api";

interface CommitBody {
  message: string;
  files?: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, files } = validateBody<CommitBody>(body, ["message"]);

    const git = getGit();

    if (files && files.length > 0) {
      await git.add(files);
    } else {
      await git.add(".");
    }

    try {
      const result = await git.commit(message);
      return ok({ committed: true, hash: result.commit || undefined });
    } catch {
      // Nothing to commit
      return ok({ committed: false });
    }
  } catch (err) {
    return handleError(err);
  }
}
