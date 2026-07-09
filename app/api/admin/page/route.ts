import { NextResponse } from "next/server";

import { getAdminContentOwnerKey, getAdminSession } from "@/lib/auth";
import {
  getBuilderPage,
  normalizeBuilderPageKind,
  publishBuilderPage,
  saveBuilderPage
} from "@/lib/content";
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

export async function GET(request: Request) {
  const session = await getAdminSession();

  if (!session.authenticated) {
    return unauthorized();
  }

  const url = new URL(request.url);
  const pageKind = normalizeBuilderPageKind(
    url.searchParams.get("slug") ?? "home"
  );
  const page = await getBuilderPage(pageKind, getAdminContentOwnerKey(session));

  return NextResponse.json(page, {
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

  try {
    const url = new URL(request.url);
    const pageKind = normalizeBuilderPageKind(
      url.searchParams.get("slug") ?? "home"
    );
    const shouldPublish = url.searchParams.get("publish") === "true";
    const body = (await request.json()) as unknown;

    if (!isBuilderPage(body)) {
      return NextResponse.json(
        { message: "저장할 페이지 형식이 올바르지 않습니다." },
        { status: 400 }
      );
    }

    const ownerKey = getAdminContentOwnerKey(session);
    const savedPage = shouldPublish
      ? await publishBuilderPage(body, ownerKey, pageKind)
      : await saveBuilderPage(
          { ...body, status: "draft" },
          ownerKey,
          pageKind
        );

    return NextResponse.json(savedPage, {
      headers: {
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "페이지를 저장하지 못했습니다."
      },
      { status: 400 }
    );
  }
}
