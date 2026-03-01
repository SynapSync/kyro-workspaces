import type { ProjectsService } from "../types";
import { mockProjects } from "@/lib/mock-data";

// Configurable artificial delay to simulate network latency in development.
// Set NEXT_PUBLIC_MOCK_DELAY_MS in .env.local to enable (default: 0).
const DELAY_MS =
  typeof process !== "undefined"
    ? Number(process.env.NEXT_PUBLIC_MOCK_DELAY_MS ?? 0)
    : 0;

const delay = (ms: number) =>
  ms > 0 ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve();

export class MockProjectsService implements ProjectsService {
  async list() {
    await delay(DELAY_MS);
    return mockProjects;
  }
}
