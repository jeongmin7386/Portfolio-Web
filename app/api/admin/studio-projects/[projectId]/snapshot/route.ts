import { NextResponse } from "next/server";

import { readJsonRequest } from "@/lib/api-request";
import {
  requireStudioProjectOwnerKey,
  studioProjectErrorResponse
} from "@/lib/studio-project-api";
import { saveCurrentToStudioProject } from "@/lib/studio-projects";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SnapshotRouteProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function POST(
  request: Request,
  { params }: SnapshotRouteProps
) {
  const context = await requireStudioProjectOwnerKey();

  if (context.response) {
    return context.response;
  }

  try {
    const { projectId } = await params;
    const body = await readJsonRequest<{
      expectedRevision?: number;
    }>(request, { maxBytes: 16 * 1024 });
    const project = await saveCurrentToStudioProject(
      context.ownerKey,
      projectId,
      body.expectedRevision
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
