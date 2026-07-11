import { NextResponse } from "next/server";

import {
  requireStudioProjectOwnerKey,
  studioProjectErrorResponse
} from "@/lib/studio-project-api";
import { exportStudioProject } from "@/lib/studio-projects";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ExportRouteProps = {
  params: Promise<{
    projectId: string;
  }>;
};

function toDownloadName(value: string) {
  const safeName =
    value
      .trim()
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9_-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 64) || "studio-project";

  return `${safeName}.studiofflower.json`;
}

export async function GET(_request: Request, { params }: ExportRouteProps) {
  const context = await requireStudioProjectOwnerKey();

  if (context.response) {
    return context.response;
  }

  try {
    const { projectId } = await params;
    const exportFile = await exportStudioProject(context.ownerKey, projectId);

    return new NextResponse(JSON.stringify(exportFile, null, 2), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${toDownloadName(
          exportFile.project.name
        )}"`,
        "Content-Type": "application/json; charset=utf-8"
      }
    });
  } catch (error) {
    return studioProjectErrorResponse(error);
  }
}
