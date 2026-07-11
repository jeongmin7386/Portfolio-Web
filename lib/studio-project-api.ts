import { NextResponse } from "next/server";

import {
  getAdminContentOwnerKey,
  getAdminSession,
  type AdminSession
} from "@/lib/auth";
import {
  StudioProjectConflictError,
  StudioProjectError
} from "@/lib/studio-projects";

type StudioProjectRequestContext =
  | {
      ownerKey: string;
      session: AdminSession;
      response: null;
    }
  | {
      ownerKey: null;
      session: AdminSession;
      response: NextResponse;
    };

export async function requireStudioProjectOwnerKey(): Promise<StudioProjectRequestContext> {
  const session = await getAdminSession();

  if (!session.authenticated) {
    return {
      ownerKey: null,
      session,
      response: NextResponse.json(
        { message: "로그인이 필요합니다." },
        { status: 401 }
      )
    };
  }

  return {
    ownerKey: getAdminContentOwnerKey(session),
    session,
    response: null
  };
}

export function studioProjectErrorResponse(error: unknown) {
  if (error instanceof StudioProjectConflictError) {
    return NextResponse.json(
      {
        message: error.message,
        latestRevision: error.latestRevision,
        latestUpdatedAt: error.latestUpdatedAt
      },
      { status: error.status }
    );
  }

  if (error instanceof StudioProjectError) {
    return NextResponse.json(
      { message: error.message },
      { status: error.status }
    );
  }

  return NextResponse.json(
    {
      message:
        error instanceof Error
          ? error.message
          : "프로젝트 작업을 처리하지 못했습니다."
    },
    { status: 500 }
  );
}
