import * as fs from "fs/promises";
import { NextRequest } from "next/server";
import {
  getWorkspacePath,
  resolveAndGuard,
  fileExists,
  ok,
  notFound,
  handleError,
} from "@/lib/api";
import {
  parseMembersFile,
} from "@/lib/file-format/parsers";
import {
  serializeMembersFile,
} from "@/lib/file-format/serializers";

interface RouteParams {
  params: Promise<{ memberId: string }>;
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { memberId } = await params;
    const workspacePath = getWorkspacePath();
    const membersPath = resolveAndGuard(workspacePath, ".kyro", "members.json");

    const fileExistsResult = await fileExists(membersPath);
    if (!fileExistsResult) {
      return notFound("Members file not found");
    }

    const body = await req.json();
    const content = await fs.readFile(membersPath, "utf-8");
    const members = parseMembersFile(content);

    const memberIndex = members.findIndex((m) => m.id === memberId);
    if (memberIndex === -1) {
      return notFound("Member not found");
    }

    const existingMember = members[memberIndex];
    members[memberIndex] = {
      ...existingMember,
      name: body.name ?? existingMember.name,
      avatar: body.avatar ?? existingMember.avatar,
      color: body.color ?? existingMember.color,
    };

    const newContent = serializeMembersFile(members);
    await fs.writeFile(membersPath, newContent, "utf-8");

    return ok({ member: members[memberIndex] }, 200);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { memberId } = await params;
    const workspacePath = getWorkspacePath();
    const membersPath = resolveAndGuard(workspacePath, ".kyro", "members.json");

    const fileExistsResult = await fileExists(membersPath);
    if (!fileExistsResult) {
      return notFound("Members file not found");
    }

    const content = await fs.readFile(membersPath, "utf-8");
    const members = parseMembersFile(content);

    const memberIndex = members.findIndex((m) => m.id === memberId);
    if (memberIndex === -1) {
      return notFound("Member not found");
    }

    members.splice(memberIndex, 1);

    const newContent = serializeMembersFile(members);
    await fs.writeFile(membersPath, newContent, "utf-8");

    return ok({ deleted: true }, 200);
  } catch (err) {
    return handleError(err);
  }
}
