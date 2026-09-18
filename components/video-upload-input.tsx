"use client";

import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { uploadAdminFile } from "@/lib/client-uploads";
import { MAX_VIDEO_BYTES } from "@/lib/video";

export function VideoUploadInput({ onUploaded }: { onUploaded: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const upload = async (file: File) => {
    if (busyRef.current) return;
    setError("");
    if (!/\.(mp4|webm)$/i.test(file.name) || !file.size || file.size > MAX_VIDEO_BYTES) {
      setError("50MB 이하의 MP4 또는 WebM 파일을 선택해 주세요.");
      return;
    }
    busyRef.current = true;
    setBusy(true);
    try {
      const url = await uploadAdminFile(file, "video");
      if (url) onUploaded(url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "동영상을 업로드하지 못했습니다.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  return (
    <div className="min-w-0" onClick={(event) => event.stopPropagation()}>
      <button
        className="inline-flex min-h-9 items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-900 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        type="button"
      >
        {busy ? <Loader2 aria-hidden className="animate-spin" size={15} /> : <Upload aria-hidden size={15} />}
        {busy ? "업로드 중…" : "동영상 업로드"}
      </button>
      <input
        ref={inputRef}
        aria-label="동영상 파일 선택"
        accept=".mp4,.webm,video/mp4,video/webm"
        className="hidden"
        type="file"
        disabled={busy}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void upload(file);
        }}
      />
      {error ? <p role="alert" className="mt-2 max-w-xs text-xs text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}
