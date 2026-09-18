import { NextResponse } from "next/server";

import { getAdminContentOwnerKey, getAdminSession } from "@/lib/auth";
import { saveUploadedImage } from "@/lib/uploads";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getAdminSession();

  if (!session.authenticated) {
    return NextResponse.json(
      { message: "관리자 로그인이 필요합니다." },
      { status: 401 }
    );
  }

  try {
    if (Number(request.headers.get("content-length")) > 51 * 1024 * 1024) {
      return NextResponse.json({ message: "파일은 50MB 이하로 업로드해 주세요." }, { status: 413 });
    }
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "업로드할 파일을 선택해 주세요." },
        { status: 400 }
      );
    }

    const uploadedImage = await saveUploadedImage(
      file,
      getAdminContentOwnerKey(session),
      formData.get("kind") === "video" ? "video" : "image"
    );

    return NextResponse.json(uploadedImage, {
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
            : "이미지를 업로드하지 못했습니다."
      },
      { status: 400 }
    );
  }
}
