import { NextResponse } from "next/server";

import { readJsonRequest } from "@/lib/api-request";
import {
  requireStudioProjectOwnerKey,
  studioProjectErrorResponse
} from "@/lib/studio-project-api";
import {
  deleteStudioProject,
  renameStudioProject
} from "@/lib/studio-projects";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type StudioProjectRouteProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function PATCH(
  request: Request,
  { params }: StudioProjectRouteProps
) {
  const context = await requireStudioProjectOwnerKey();

  if (context.response) {
    return context.response;
  }

  try {
    const { projectId } = await params;
    const body = await readJsonRequest<{ name?: string }>(request, {
      maxBytes: 16 * 1024
    });
    const project = await renameStudioProject(
      context.ownerKey,
      projectId,
      body.name ?? ""
    );

    return NextResponse.json({ project }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return studioProjectErrorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: StudioProjectRouteProps
) {
  const context = await requireStudioProjectOwnerKey();

  if (context.response) {
    return context.response;
  }

  try {
    const { projectId } = await params;
    await deleteStudioProject(context.ownerKey, projectId);

    return NextResponse.json(
      { ok: true },
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
