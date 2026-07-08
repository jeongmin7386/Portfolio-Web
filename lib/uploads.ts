import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const allowedTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
  ["image/svg+xml", ".svg"]
]);
const maxUploadBytes = 10 * 1024 * 1024;

export const uploadRoot = process.env.STUDIO_ARCHIVE_UPLOAD_DIR
  ? path.resolve(process.env.STUDIO_ARCHIVE_UPLOAD_DIR)
  : path.join(process.cwd(), "data", "uploads");

function sanitizeName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

function getExtension(file: File) {
  const extensionFromType = allowedTypes.get(file.type);

  if (extensionFromType) {
    return extensionFromType;
  }

  const extensionFromName = path.extname(file.name).toLowerCase();
  return Array.from(allowedTypes.values()).includes(extensionFromName)
    ? extensionFromName
    : undefined;
}

function getContentType(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();

  switch (extension) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

export async function saveUploadedImage(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("이미지 파일만 업로드할 수 있습니다.");
  }

  if (file.size > maxUploadBytes) {
    throw new Error("이미지는 10MB 이하로 업로드해 주세요.");
  }

  const extension = getExtension(file);

  if (!extension) {
    throw new Error("지원하지 않는 이미지 형식입니다.");
  }

  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const baseName = sanitizeName(path.basename(file.name, path.extname(file.name)));
  const fileName = `${Date.now()}-${crypto.randomUUID()}-${
    baseName || "image"
  }${extension}`;
  const filePath = path.join(uploadRoot, fileName);

  await fs.mkdir(uploadRoot, { recursive: true });
  await fs.writeFile(filePath, fileBuffer);

  return {
    fileName,
    url: `/uploads/${fileName}`
  };
}

export async function readUploadedImage(pathSegments: string[]) {
  const requestedPath = path.resolve(uploadRoot, ...pathSegments);
  const rootWithSeparator = `${uploadRoot}${path.sep}`;

  if (
    requestedPath !== uploadRoot &&
    !requestedPath.startsWith(rootWithSeparator)
  ) {
    throw new Error("Invalid upload path.");
  }

  const buffer = await fs.readFile(requestedPath);

  return {
    buffer,
    contentType: getContentType(requestedPath)
  };
}
