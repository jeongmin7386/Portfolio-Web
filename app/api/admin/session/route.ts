import { NextResponse } from "next/server";

import { getAdminSession, getSessionEditPath } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const session = await getAdminSession();

  return NextResponse.json(
    {
      authenticated: session.authenticated,
      editPath: session.authenticated ? getSessionEditPath(session) : null,
      isOwner: session.isOwner,
      user: session.user
        ? {
            email: session.user.email,
            id: session.user.id,
            name: session.user.name,
            role: session.user.role
          }
        : null
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
