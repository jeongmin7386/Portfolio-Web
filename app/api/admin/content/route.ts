import { NextResponse } from "next/server";

import {
  getStudioArchiveContent,
  saveStudioArchiveContent
} from "@/lib/content";
import { getAdminContentOwnerKey, getAdminSession } from "@/lib/auth";
import {
  ContentValidationError,
  validateStudioArchiveContent
} from "@/lib/content-validation";
import type { StudioArchiveContent } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isEditableContent(value: unknown): value is StudioArchiveContent {
  if (!value || typeof value !== "object") {
    return false;
  }

  const content = value as Partial<StudioArchiveContent>;
  return (
    Array.isArray(content.categories) &&
    Array.isArray(content.projects) &&
    Array.isArray(content.notes)
  );
}

function unauthorized() {
  return NextResponse.json(
    { message: "관리자 로그인이 필요합니다." },
    { status: 401 }
  );
}

export async function GET() {
  const session = await getAdminSession();

  if (!session.authenticated) {
    return unauthorized();
  }

  const content = await getStudioArchiveContent(getAdminContentOwnerKey(session));

  return NextResponse.json(content, {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}

export async function PUT(request: Request) {
  const session = await getAdminSession();

  if (!session.authenticated) {
    return unauthorized();
  }

  const body = (await request.json()) as unknown;

  if (!isEditableContent(body)) {
    return NextResponse.json(
      { message: "저장할 콘텐츠 형식이 올바르지 않습니다." },
      { status: 400 }
    );
  }

  try {
    const validatedContent = validateStudioArchiveContent(body);
    const savedContent = await saveStudioArchiveContent(
      validatedContent,
      getAdminContentOwnerKey(session)
    );

    return NextResponse.json(savedContent, {
      headers: {
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    if (error instanceof ContentValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    throw error;
  }
}
