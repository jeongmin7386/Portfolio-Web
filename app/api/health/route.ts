import { NextResponse } from "next/server";

import { getContentStorageMode } from "@/lib/content";
import { getUploadStorageMode } from "@/lib/uploads";

export const dynamic = "force-dynamic";

export function GET() {
  const uploadStorage = getUploadStorageMode();

  return NextResponse.json(
    {
      ok: true,
      service: "studio-archive",
      storage: {
        content: getContentStorageMode(),
        upload: uploadStorage,
        uploadsStable: uploadStorage !== "ephemeral-file"
      }
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
