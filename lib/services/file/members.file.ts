import type {
  MembersService,
  CreateMemberInput,
  UpdateMemberInput,
} from "../types";
import type { TeamMember } from "@/lib/types";
import { localFetch } from "./fetch";

export class FileMembersService implements MembersService {
  async list(): Promise<TeamMember[]> {
    const { members } = await localFetch<{ members: TeamMember[] }>(
      "/api/members"
    );
    return members;
  }

  async createMember(data: CreateMemberInput): Promise<TeamMember> {
    const { member } = await localFetch<{ member: TeamMember }>(
      "/api/members",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    return member;
  }

  async updateMember(
    id: string,
    updates: UpdateMemberInput
  ): Promise<TeamMember> {
    const { member } = await localFetch<{ member: TeamMember }>(
      `/api/members/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(updates),
      }
    );
    return member;
  }

  async deleteMember(id: string): Promise<void> {
    await localFetch(`/api/members/${id}`, { method: "DELETE" });
  }
}
