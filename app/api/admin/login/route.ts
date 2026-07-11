import { NextResponse } from "next/server";

import {
  getSessionEditPath,
  isOwnerPasswordConfigured,
  isAdminAuthEnabled,
  setAdminSessionCookie,
  verifyAdminAccount,
  verifyAdminPassword
} from "@/lib/auth";
import { AdminUserError } from "@/lib/admin-users";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isAdminAuthEnabled()) {
    return NextResponse.json(
      { message: "관리자 로그인이 꺼져 있습니다." },
      { status: 400 }
    );
  }

  const body = (await request.json()) as {
    email?: string;
    ownerPassword?: string;
    password?: string;
  };
  const email = body.email?.trim();
  const password = body.password ?? "";

  if (email !== undefined) {
    if (!email || !password) {
      return NextResponse.json(
        { message: "이메일과 비밀번호를 입력해주세요." },
        { status: 400 }
      );
    }

    try {
      const user = await verifyAdminAccount(email, password);
      await setAdminSessionCookie(user);

      return NextResponse.json({
        ok: true,
        redirectTo: getSessionEditPath({
          authEnabled: true,
          authenticated: true,
          isOwner: false,
          user: {
            email: user.email,
            id: user.id,
            name: user.name,
            role: "admin"
          }
        })
      });
    } catch (error) {
      if (error instanceof AdminUserError) {
        return NextResponse.json(
          { message: error.message },
          { status: error.status }
        );
      }

      return NextResponse.json(
        { message: "로그인하지 못했습니다." },
        { status: 500 }
      );
    }
  }

  if (body.ownerPassword === undefined) {
    return NextResponse.json(
      { message: "로그인 방식을 다시 선택해주세요." },
      { status: 400 }
    );
  }

  if (!isOwnerPasswordConfigured()) {
    return NextResponse.json(
      { message: "소유자 비밀번호가 아직 설정되지 않았습니다." },
      { status: 400 }
    );
  }

  const ownerPassword = body.ownerPassword;

  if (!ownerPassword || !verifyAdminPassword(ownerPassword)) {
    return NextResponse.json(
      { message: "비밀번호가 올바르지 않습니다." },
      { status: 401 }
    );
  }

  await setAdminSessionCookie();

  return NextResponse.json({ ok: true, redirectTo: "/admin" });
}
