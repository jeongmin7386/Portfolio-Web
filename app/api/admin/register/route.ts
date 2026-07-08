import { NextResponse } from "next/server";

import {
  AdminUserError,
  createAdminAccessRequest
} from "@/lib/admin-users";
import { isAdminAuthEnabled } from "@/lib/auth";

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
    name?: string;
    password?: string;
  };

  try {
    const user = await createAdminAccessRequest({
      email: body.email ?? "",
      name: body.name ?? "",
      password: body.password ?? ""
    });

    return NextResponse.json(
      {
        message: "계정 신청이 접수되었습니다. 소유자 승인 후 로그인할 수 있습니다.",
        user
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AdminUserError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { message: "계정 신청을 접수하지 못했습니다." },
      { status: 500 }
    );
  }
}
