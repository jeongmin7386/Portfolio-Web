import { NextResponse } from "next/server";

import { getSessionEditPath } from "@/lib/auth";
import {
  requireStudioProjectOwnerKey,
  studioProjectErrorResponse
} from "@/lib/studio-project-api";
import { openStudioProject } from "@/lib/studio-projects";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type OpenRouteProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function POST(_request: Request, { params }: OpenRouteProps) {
  const context = await requireStudioProjectOwnerKey();

  if (context.response) {
    return context.response;
  }

  try {
    const { projectId } = await params;
    const project = await openStudioProject(context.ownerKey, projectId);

    return NextResponse.json(
      {
        project,
        editPath: getSessionEditPath(context.session)
      },
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
