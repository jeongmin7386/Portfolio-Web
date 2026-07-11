import { NextResponse } from "next/server";

import {
  requireStudioProjectOwnerKey,
  studioProjectErrorResponse
} from "@/lib/studio-project-api";
import {
  createStudioProjectFromCurrent,
  ensureCurrentStudioProject,
  importStudioProject,
  listStudioProjects
} from "@/lib/studio-projects";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CreateProjectBody =
  | {
      action?: "save-current";
      name?: string;
    }
  | {
      action: "import";
      name?: string;
      file: unknown;
    };

export async function GET() {
  const context = await requireStudioProjectOwnerKey();

  if (context.response) {
    return context.response;
  }

  try {
    await ensureCurrentStudioProject(context.ownerKey);
    const projects = await listStudioProjects(context.ownerKey);

    return NextResponse.json(
      { projects },
      {
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error) {
    return studioProjectErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const context = await requireStudioProjectOwnerKey();

  if (context.response) {
    return context.response;
  }

  try {
    const body = (await request.json()) as CreateProjectBody;
    const project =
      body.action === "import"
        ? await importStudioProject(context.ownerKey, body.file, body.name)
        : await createStudioProjectFromCurrent(
            context.ownerKey,
            body.name || "새 프로젝트"
          );

    return NextResponse.json(
      { project },
      {
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error) {
    return studioProjectErrorResponse(error);
  }
}
