import { NextResponse } from "next/server";

import {
  isAdminAuthEnabled,
  setAdminSessionCookie,
  verifyAdminPassword
} from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isAdminAuthEnabled()) {
    return NextResponse.json(
      { message: "관리자 비밀번호가 아직 설정되지 않았습니다." },
      { status: 400 }
    );
  }

  const body = (await request.json()) as { password?: string };

  if (!body.password || !verifyAdminPassword(body.password)) {
    return NextResponse.json(
      { message: "비밀번호가 올바르지 않습니다." },
      { status: 401 }
    );
  }

  await setAdminSessionCookie();

  return NextResponse.json({ ok: true });
}
