import { notFound } from "next/navigation";

import { readUploadedImage } from "@/lib/uploads";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type UploadRouteProps = {
  params: Promise<{
    path: string[];
  }>;
};

export async function GET(_request: Request, { params }: UploadRouteProps) {
  const { path } = await params;

  try {
    const image = await readUploadedImage(path);

    return new Response(image.buffer, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Disposition": "inline",
        "Content-Length": String(image.size),
        "Content-Type": image.contentType,
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch {
    notFound();
  }
}
