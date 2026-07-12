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
import {
  assertLoginAllowed,
  clearLoginFailures,
  getLoginAttemptKey,
  recordLoginFailure
} from "@/lib/login-rate-limit";

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
    const attemptKey = getLoginAttemptKey(request, email);
    const blocked = assertLoginAllowed(attemptKey);

    if (blocked) {
      return NextResponse.json(
        { message: "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요." },
        {
          headers: {
            "Retry-After": String(blocked.retryAfterSeconds)
          },
          status: 429
        }
      );
    }

    if (!email || !password) {
      return NextResponse.json(
        { message: "이메일과 비밀번호를 입력해주세요." },
        { status: 400 }
      );
    }

    try {
      const user = await verifyAdminAccount(email, password);
      await setAdminSessionCookie(user);
      clearLoginFailures(attemptKey);

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
      recordLoginFailure(attemptKey);

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
  const ownerAttemptKey = getLoginAttemptKey(request, "owner");
  const ownerBlocked = assertLoginAllowed(ownerAttemptKey);

  if (ownerBlocked) {
    return NextResponse.json(
      { message: "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요." },
      {
        headers: {
          "Retry-After": String(ownerBlocked.retryAfterSeconds)
        },
        status: 429
      }
    );
  }

  if (!ownerPassword || !verifyAdminPassword(ownerPassword)) {
    recordLoginFailure(ownerAttemptKey);
    return NextResponse.json(
      { message: "비밀번호가 올바르지 않습니다." },
      { status: 401 }
    );
  }

  await setAdminSessionCookie();
  clearLoginFailures(ownerAttemptKey);

  return NextResponse.json({ ok: true, redirectTo: "/admin" });
}
