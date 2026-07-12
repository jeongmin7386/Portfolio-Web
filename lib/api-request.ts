import { NextResponse } from "next/server";

export class RequestBodyError extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message);
  }
}

type ReadJsonRequestOptions = {
  allowEmpty?: boolean;
  maxBytes?: number;
};

const defaultMaxJsonBytes = 2 * 1024 * 1024;

export async function readJsonRequest<T = unknown>(
  request: Request,
  options: ReadJsonRequestOptions = {}
): Promise<T> {
  const maxBytes = options.maxBytes ?? defaultMaxJsonBytes;
  const contentLength = Number(request.headers.get("content-length") ?? 0);

  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new RequestBodyError("요청 데이터가 너무 큽니다.", 413);
  }

  const text = await request.text();

  if (Buffer.byteLength(text, "utf8") > maxBytes) {
    throw new RequestBodyError("요청 데이터가 너무 큽니다.", 413);
  }

  if (!text.trim()) {
    if (options.allowEmpty) {
      return {} as T;
    }

    throw new RequestBodyError("요청 본문이 비어 있습니다.", 400);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new RequestBodyError("JSON 형식이 올바르지 않습니다.", 400);
  }
}

export function requestBodyErrorResponse(error: RequestBodyError) {
  return NextResponse.json({ message: error.message }, { status: error.status });
}
