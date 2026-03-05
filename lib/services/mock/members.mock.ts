import type {
  MembersService,
  CreateMemberInput,
  UpdateMemberInput,
} from "../types";
import type { TeamMember } from "@/lib/types";
import { teamMembers } from "@/lib/mock-data";

const DELAY_MS =
  typeof process !== "undefined"
    ? Number(process.env.NEXT_PUBLIC_MOCK_DELAY_MS ?? 0)
    : 0;

const delay = (ms: number) =>
  ms > 0 ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve();

export class MockMembersService implements MembersService {
  async list() {
    await delay(DELAY_MS);
    return teamMembers;
  }

  async createMember(_data: CreateMemberInput): Promise<TeamMember> {
    throw new Error("MockMembersService: createMember not implemented");
  }

  async updateMember(_id: string, _updates: UpdateMemberInput): Promise<TeamMember> {
    throw new Error("MockMembersService: updateMember not implemented");
  }

  async deleteMember(_id: string): Promise<void> {
    throw new Error("MockMembersService: deleteMember not implemented");
  }
}
