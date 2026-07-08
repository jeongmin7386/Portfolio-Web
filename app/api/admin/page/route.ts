import { NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/auth";
import { getBuilderPage, saveBuilderPage } from "@/lib/content";
import type { BuilderPage } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json(
    { message: "관리자 로그인이 필요합니다." },
    { status: 401 }
  );
}

function isBuilderPage(value: unknown): value is BuilderPage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const page = value as Partial<BuilderPage>;
  return (
    typeof page.id === "string" &&
    typeof page.slug === "string" &&
    typeof page.title === "string" &&
    Array.isArray(page.sections)
  );
}

export async function GET() {
  if (!(await requireAdminAccess())) {
    return unauthorized();
  }

  const page = await getBuilderPage("home");

  return NextResponse.json(page, {
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

  if (!isBuilderPage(body)) {
    return NextResponse.json(
      { message: "저장할 페이지 형식이 올바르지 않습니다." },
      { status: 400 }
    );
  }

  const savedPage = await saveBuilderPage(body);

  return NextResponse.json(savedPage, {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
