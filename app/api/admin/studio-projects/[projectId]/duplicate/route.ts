import { NextResponse } from "next/server";

import {
  requireStudioProjectOwnerKey,
  studioProjectErrorResponse
} from "@/lib/studio-project-api";
import { duplicateStudioProject } from "@/lib/studio-projects";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DuplicateRouteProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function POST(
  _request: Request,
  { params }: DuplicateRouteProps
) {
  const context = await requireStudioProjectOwnerKey();

  if (context.response) {
    return context.response;
  }

  try {
    const { projectId } = await params;
    const project = await duplicateStudioProject(context.ownerKey, projectId);

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
