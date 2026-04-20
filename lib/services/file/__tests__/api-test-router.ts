import { NextRequest } from "next/server";
import { vi } from "vitest";
import * as WorkspaceInitRoute from "@/app/api/workspace/init/route";
import * as ProjectsRoute from "@/app/api/projects/route";
import * as ProjectRoute from "@/app/api/projects/[projectId]/route";
import * as SprintsRoute from "@/app/api/projects/[projectId]/sprints/route";
import * as SprintRoute from "@/app/api/projects/[projectId]/sprints/[sprintId]/route";
import * as TasksRoute from "@/app/api/projects/[projectId]/sprints/[sprintId]/tasks/route";
import * as TaskRoute from "@/app/api/projects/[projectId]/sprints/[sprintId]/tasks/[taskId]/route";
import * as DocumentsRoute from "@/app/api/projects/[projectId]/documents/route";
import * as DocumentRoute from "@/app/api/projects/[projectId]/documents/[docId]/route";
import * as MembersRoute from "@/app/api/members/route";
import * as MemberRoute from "@/app/api/members/[memberId]/route";
import * as FindingsRoute from "@/app/api/projects/[projectId]/findings/route";
import * as RoadmapRoute from "@/app/api/projects/[projectId]/roadmap/route";
import * as ActivitiesRoute from "@/app/api/activities/route";

type Method = "GET" | "POST" | "PUT" | "DELETE";

type RequestHandler = (
  req: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => Promise<Response>;

function pickHandler(route: Record<string, unknown>, method: Method): RequestHandler | null {
  const candidate = route[method];
  if (typeof candidate !== "function") {
    return null;
  }
  return candidate as RequestHandler;
}

function routeFor(pathname: string):
  | { module: Record<string, unknown>; params?: Record<string, string> }
  | null {
  let match = pathname.match(/^\/api\/projects\/([^/]+)\/sprints\/([^/]+)\/tasks\/([^/]+)$/);
  if (match) {
    return {
      module: TaskRoute,
      params: {
        projectId: decodeURIComponent(match[1]),
        sprintId: decodeURIComponent(match[2]),
        taskId: decodeURIComponent(match[3]),
      },
    };
  }

  match = pathname.match(/^\/api\/projects\/([^/]+)\/sprints\/([^/]+)\/tasks$/);
  if (match) {
    return {
      module: TasksRoute,
      params: { projectId: decodeURIComponent(match[1]), sprintId: decodeURIComponent(match[2]) },
    };
  }

  match = pathname.match(/^\/api\/projects\/([^/]+)\/sprints\/([^/]+)$/);
  if (match) {
    return {
      module: SprintRoute,
      params: { projectId: decodeURIComponent(match[1]), sprintId: decodeURIComponent(match[2]) },
    };
  }

  match = pathname.match(/^\/api\/projects\/([^/]+)\/sprints$/);
  if (match) {
    return {
      module: SprintsRoute,
      params: { projectId: decodeURIComponent(match[1]) },
    };
  }

  match = pathname.match(/^\/api\/projects\/([^/]+)\/findings$/);
  if (match) {
    return {
      module: FindingsRoute,
      params: { projectId: decodeURIComponent(match[1]) },
    };
  }

  match = pathname.match(/^\/api\/projects\/([^/]+)\/roadmap$/);
  if (match) {
    return {
      module: RoadmapRoute,
      params: { projectId: decodeURIComponent(match[1]) },
    };
  }

  match = pathname.match(/^\/api\/projects\/([^/]+)\/documents\/([^/]+)$/);
  if (match) {
    return {
      module: DocumentRoute,
      params: { projectId: decodeURIComponent(match[1]), docId: decodeURIComponent(match[2]) },
    };
  }

  match = pathname.match(/^\/api\/projects\/([^/]+)\/documents$/);
  if (match) {
    return {
      module: DocumentsRoute,
      params: { projectId: decodeURIComponent(match[1]) },
    };
  }

  match = pathname.match(/^\/api\/projects\/([^/]+)$/);
  if (match) {
    return {
      module: ProjectRoute,
      params: { projectId: decodeURIComponent(match[1]) },
    };
  }

  match = pathname.match(/^\/api\/members\/([^/]+)$/);
  if (match) {
    return {
      module: MemberRoute,
      params: { memberId: decodeURIComponent(match[1]) },
    };
  }

  if (pathname === "/api/workspace/init") {
    return { module: WorkspaceInitRoute };
  }

  if (pathname === "/api/projects") {
    return { module: ProjectsRoute };
  }

  if (pathname === "/api/members") {
    return { module: MembersRoute };
  }

  if (pathname === "/api/activities") {
    return { module: ActivitiesRoute };
  }

  return null;
}

export function installApiFetchMock() {
  const originalFetch = globalThis.fetch;

  const mockedFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const rawUrl = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const url = new URL(rawUrl, "http://localhost");
    const pathname = url.pathname;
    const method = ((init?.method ?? "GET").toUpperCase() as Method);

    const target = routeFor(pathname);
    if (!target) {
      return new Response(JSON.stringify({ error: { message: `No route for ${pathname}` } }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }

    const handler = pickHandler(target.module, method);
    if (!handler) {
      return new Response(JSON.stringify({ error: { message: `Method ${method} not allowed` } }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }

    const req = new NextRequest(url.toString(), {
      method,
      headers: init?.headers,
      body: init?.body,
    });

    if (target.params) {
      return handler(req, { params: Promise.resolve(target.params) });
    }

    return handler(req);
  });

  globalThis.fetch = mockedFetch as typeof fetch;

  return {
    fetchMock: mockedFetch,
    restore: () => {
      globalThis.fetch = originalFetch;
    },
  };
}
