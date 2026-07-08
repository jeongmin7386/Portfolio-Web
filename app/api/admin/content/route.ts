import { NextResponse } from "next/server";

import {
  getStudioArchiveContent,
  saveStudioArchiveContent
} from "@/lib/content";
import type { StudioArchiveContent } from "@/lib/types";

export const dynamic = "force-dynamic";

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

export async function GET() {
  const content = await getStudioArchiveContent();

  return NextResponse.json(content, {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}

export async function PUT(request: Request) {
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
