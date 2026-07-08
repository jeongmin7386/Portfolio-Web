import { NextResponse } from "next/server";

import {
  AdminUserError,
  type AdminUserStatus,
  updateAdminUserStatus
} from "@/lib/admin-users";
import { requireOwnerAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function forbidden() {
  return NextResponse.json(
    { message: "소유자 승인 권한이 필요합니다." },
    { status: 403 }
  );
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await requireOwnerAccess())) {
    return forbidden();
  }

  const { id } = await context.params;
  const body = (await request.json()) as {
    status?: AdminUserStatus;
  };

  try {
    const user = await updateAdminUserStatus(id, body.status ?? "pending");
    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof AdminUserError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { message: "계정 상태를 변경하지 못했습니다." },
      { status: 500 }
    );
  }
}
