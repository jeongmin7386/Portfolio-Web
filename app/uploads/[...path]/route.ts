import { notFound } from "next/navigation";

import { readUploadedImage } from "@/lib/uploads";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type UploadRouteProps = {
  params: Promise<{
    path: string[];
  }>;
};

export async function GET(request: Request, { params }: UploadRouteProps) {
  const { path } = await params;

  try {
    const image = await readUploadedImage(path);

    const headers = {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Disposition": "inline",
        "Content-Length": String(image.size),
        "Content-Type": image.contentType,
        "X-Content-Type-Options": "nosniff",
        "Accept-Ranges": "bytes"
    };
    const range = request.headers.get("range");
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      const start = match?.[1] ? Number(match[1]) : Math.max(0, image.size - Number(match?.[2]));
      const end = match?.[1] && match[2] ? Math.min(Number(match[2]), image.size - 1) : image.size - 1;
      if (!match || (!match[1] && !match[2]) || !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= image.size) {
        return new Response(null, { status: 416, headers: { ...headers, "Content-Length": "0", "Content-Range": `bytes */${image.size}` } });
      }
      return new Response(image.buffer.subarray(start, end + 1), {
        status: 206,
        headers: { ...headers, "Content-Length": String(end - start + 1), "Content-Range": `bytes ${start}-${end}/${image.size}` }
      });
    }
    return new Response(image.buffer, { headers });
  } catch {
    notFound();
  }
}
