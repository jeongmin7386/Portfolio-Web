export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export function isUploadedVideoUrl(value: unknown): value is string {
  return typeof value === "string" && /^\/uploads\/[a-z0-9_-]+\.(mp4|webm)$/i.test(value);
}
