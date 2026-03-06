import type {
  MembersService,
  CreateMemberInput,
  UpdateMemberInput,
} from "../types";
import type { TeamMember } from "@/lib/types";
import { teamMembers } from "@/lib/mock-data";
import { mockDelay } from "./delay";

export class MockMembersService implements MembersService {
  async list() {
    await mockDelay();
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
