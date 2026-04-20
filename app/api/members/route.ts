import * as fs from "fs/promises";
import { NextRequest } from "next/server";
import {
  getWorkspacePath,
  resolveAndGuard,
  fileExists,
  ok,
  handleError,
  validateBody,
} from "@/lib/api";
import {
  parseMembersFile,
} from "@/lib/file-format/parsers";
import {
  serializeMembersFile,
} from "@/lib/file-format/serializers";

function generateMemberId(): string {
  return `member-${Date.now().toString(36)}`;
}

export async function GET(req: NextRequest) {
  try {
    const workspacePath = getWorkspacePath();
    const membersPath = resolveAndGuard(workspacePath, ".kyro", "members.json");

    const fileExistsResult = await fileExists(membersPath);
    if (!fileExistsResult) {
      return ok({ members: [] }, 200);
    }

    const content = await fs.readFile(membersPath, "utf-8");
    const members = parseMembersFile(content);

    return ok({ members }, 200);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const workspacePath = getWorkspacePath();
    const body = await req.json();
    validateBody<{ name: string }>(body, ["name"]);

    const membersPath = resolveAndGuard(workspacePath, ".kyro", "members.json");
    const fileExistsResult = await fileExists(membersPath);

    let members: Array<{ id?: string; name: string; avatar: string; color: string }> = [];
    if (fileExistsResult) {
      const content = await fs.readFile(membersPath, "utf-8");
      members = parseMembersFile(content);
    }

    const newMember = {
      id: generateMemberId(),
      name: body.name,
      avatar: body.avatar ?? "",
      color: body.color ?? "#888888",
    };

    members.push(newMember);

    const newContent = serializeMembersFile(members);
    await fs.writeFile(membersPath, newContent, "utf-8");

    return ok({ member: newMember }, 201);
  } catch (err) {
    return handleError(err);
  }
}
