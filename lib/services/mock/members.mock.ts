import type { MembersService } from "../types";
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
}
