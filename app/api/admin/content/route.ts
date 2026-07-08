import { NextResponse } from "next/server";

import {
  getStudioArchiveContent,
  saveStudioArchiveContent
} from "@/lib/content";
import { requireAdminAccess } from "@/lib/auth";
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
  if (!(await requireAdminAccess())) {
    return unauthorized();
  }

  const content = await getStudioArchiveContent();

  return NextResponse.json(content, {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}

export async function PUT(request: Request) {
  if (!(await requireAdminAccess())) {
    return unauthorized();
  }

  const body = (await request.json()) as unknown;

  if (!isEditableContent(body)) {
    return NextResponse.json(
      { message: "저장할 콘텐츠 형식이 올바르지 않습니다." },
      { status: 400 }
    );
  }

  const savedContent = await saveStudioArchiveContent(body);

  return NextResponse.json(savedContent, {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
