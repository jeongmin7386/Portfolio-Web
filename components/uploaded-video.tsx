"use client";

import { useState } from "react";

export function UploadedVideo({ src, title }: { src: string; title: string }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <p role="alert" className="p-4 text-sm">
      동영상을 재생하지 못했습니다. 파일을 확인하거나 H.264 형식의 MP4로 다시 업로드해 주세요.
      <button className="ml-2 underline" onClick={() => setFailed(false)} type="button">다시 시도</button>
    </p>
  ) : (
    <video
      aria-label={title}
      className="h-full w-full object-contain"
      controls
      playsInline
      preload="metadata"
      src={src}
      onError={() => setFailed(true)}
    />
  );
}
