import { NextResponse } from "next/server";

import { listAdminUsers } from "@/lib/admin-users";
import { requireOwnerAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function forbidden() {
  return NextResponse.json(
    { message: "소유자 승인 권한이 필요합니다." },
    { status: 403 }
  );
}

export async function GET() {
  if (!(await requireOwnerAccess())) {
    return forbidden();
  }

  return NextResponse.json(
    { users: await listAdminUsers() },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
