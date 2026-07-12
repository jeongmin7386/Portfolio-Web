import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { Pool, type PoolConfig } from "pg";

const allowedTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/pjpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/x-png", ".png"],
  ["image/webp", ".webp"],
  ["image/avif", ".avif"],
  ["image/gif", ".gif"]
]);

const allowedExtensions = new Set([...Array.from(allowedTypes.values()), ".jpeg"]);
const maxUploadBytes = 10 * 1024 * 1024;
const databaseUrl =
  process.env.STUDIO_ARCHIVE_DATABASE_URL ?? process.env.DATABASE_URL;
const configuredUploadRoot = process.env.STUDIO_ARCHIVE_UPLOAD_DIR?.trim();

export type UploadStorageMode = "database" | "persistent-file" | "ephemeral-file";

export const uploadRoot = configuredUploadRoot
  ? path.resolve(configuredUploadRoot)
  : path.join(process.cwd(), "data", "uploads");

let pool: Pool | undefined;
let uploadTableReady = false;

function sanitizeName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

function sanitizeOwnerKey(value = "owner") {
  return (
    value
      .trim()
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9_-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 64) || "owner"
  );
}

function getExtension(file: File) {
  const extensionFromType = allowedTypes.get(file.type.toLowerCase());

  if (extensionFromType) {
    return extensionFromType;
  }

  const extensionFromName = path.extname(file.name).toLowerCase();

  if (!allowedExtensions.has(extensionFromName)) {
    return undefined;
  }

  return extensionFromName === ".jpeg" ? ".jpg" : extensionFromName;
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
    case ".avif":
      return "image/avif";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

export function getUploadStorageMode(): UploadStorageMode {
  if (databaseUrl) {
    return "database";
  }

  if (configuredUploadRoot) {
    return "persistent-file";
  }

  return "ephemeral-file";
}

function assertStableUploadStorage() {
  if (getUploadStorageMode() !== "ephemeral-file") {
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    return;
  }

  throw new Error(
    "이미지 저장소가 설정되지 않았습니다. Render에서는 DATABASE_URL 또는 STUDIO_ARCHIVE_DATABASE_URL을 연결한 뒤 다시 업로드해 주세요."
  );
}

function validateUploadedImageBasics(file: File) {
  if (file.type && !file.type.startsWith("image/")) {
    throw new Error("이미지 파일만 업로드할 수 있습니다.");
  }

  if (file.size > maxUploadBytes) {
    throw new Error("이미지는 10MB 이하로 업로드해 주세요.");
  }
}

function sniffImageType(buffer: Buffer) {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  const prefix = buffer.subarray(0, 12).toString("ascii");

  if (prefix.startsWith("GIF87a") || prefix.startsWith("GIF89a")) {
    return "image/gif";
  }

  if (prefix.startsWith("RIFF") && prefix.slice(8, 12) === "WEBP") {
    return "image/webp";
  }

  if (buffer.length >= 12 && buffer.subarray(4, 12).toString("ascii").startsWith("ftypavif")) {
    return "image/avif";
  }

  return undefined;
}

function assertSupportedImageContent(
  buffer: Buffer,
  declaredType: string,
  extension: string
) {
  const sniffedType = sniffImageType(buffer);

  if (!sniffedType) {
    throw new Error("이미지 파일 내용을 확인할 수 없습니다. JPG, PNG, WebP, AVIF, GIF 파일만 업로드해주세요.");
  }

  const expectedExtension = allowedTypes.get(sniffedType);

  if (!expectedExtension) {
    throw new Error("지원하지 않는 이미지 형식입니다.");
  }

  if (declaredType && declaredType !== sniffedType && !(declaredType === "image/pjpeg" && sniffedType === "image/jpeg")) {
    throw new Error("이미지 형식과 파일 내용이 일치하지 않습니다.");
  }

  if (extension !== expectedExtension) {
    throw new Error("이미지 확장자와 파일 내용이 일치하지 않습니다.");
  }
}

function assertSupportedImageExtension(
  extension: string | undefined
): asserts extension is string {
  if (extension) {
    return;
  }

  throw new Error(
    "지원하지 않는 이미지 형식입니다. JPG, PNG, WebP, AVIF, GIF로 변환한 뒤 업로드해 주세요."
  );
}

function getDatabaseSsl(): PoolConfig["ssl"] {
  const sslMode =
    process.env.STUDIO_ARCHIVE_DATABASE_SSL ?? process.env.PGSSLMODE;

  if (sslMode === "disable") {
    return false;
  }

  if (
    sslMode === "require" ||
    databaseUrl?.includes("sslmode=require") ||
    process.env.NODE_ENV === "production"
  ) {
    return {
      rejectUnauthorized: false
    };
  }

  return undefined;
}

function getPool() {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  pool ??= new Pool({
    connectionString: databaseUrl,
    ssl: getDatabaseSsl()
  });

  return pool;
}

async function ensureUploadTable() {
  if (uploadTableReady) {
    return;
  }

  await getPool().query(`
    create table if not exists studio_archive_uploads (
      file_name text primary key,
      owner_key text not null default 'owner',
      content_type text not null,
      content bytea not null,
      size_bytes integer not null,
      created_at timestamptz not null default now()
    )
  `);
  await getPool().query(`
    alter table studio_archive_uploads
      add column if not exists owner_key text not null default 'owner'
  `);
  await getPool().query(`
    create index if not exists studio_archive_uploads_owner_idx
      on studio_archive_uploads (owner_key, created_at desc)
  `);

  uploadTableReady = true;
}

async function saveUploadedImageToDatabase(
  fileName: string,
  ownerKey: string,
  contentType: string,
  fileBuffer: Buffer
) {
  await ensureUploadTable();
  await getPool().query(
    `
      insert into studio_archive_uploads (
        file_name,
        owner_key,
        content_type,
        content,
        size_bytes,
        created_at
      )
      values ($1, $2, $3, $4, $5, now())
      on conflict (file_name)
      do update set
        owner_key = excluded.owner_key,
        content_type = excluded.content_type,
        content = excluded.content,
        size_bytes = excluded.size_bytes
    `,
    [fileName, ownerKey, contentType, fileBuffer, fileBuffer.byteLength]
  );
}

async function readUploadedImageFromDatabase(fileName: string) {
  await ensureUploadTable();

  const result = await getPool().query<{
    content_type: string;
    content: Buffer;
    size_bytes: number;
  }>(
    `
      select content_type, content, size_bytes
      from studio_archive_uploads
      where file_name = $1
    `,
    [fileName]
  );

  const row = result.rows[0];

  if (!row) {
    throw new Error("Upload not found.");
  }

  return {
    buffer: row.content,
    contentType: row.content_type,
    size: row.size_bytes
  };
}

export async function saveUploadedImage(file: File, ownerKey = "owner") {
  validateUploadedImageBasics(file);

  const extension = getExtension(file);
  assertSupportedImageExtension(extension);

  assertStableUploadStorage();

  const fileBuffer = Buffer.from(await file.arrayBuffer());
  assertSupportedImageContent(fileBuffer, file.type.toLowerCase(), extension);

  const baseName = sanitizeName(path.basename(file.name, path.extname(file.name)));
  const safeOwnerKey = sanitizeOwnerKey(ownerKey);
  const fileName = `${Date.now()}-${crypto.randomUUID()}-${
    safeOwnerKey
  }-${baseName || "image"
  }${extension}`;
  const contentType = getContentType(fileName);

  if (databaseUrl) {
    await saveUploadedImageToDatabase(fileName, safeOwnerKey, contentType, fileBuffer);
  } else {
    const filePath = path.join(uploadRoot, fileName);

    await fs.mkdir(uploadRoot, { recursive: true });
    await fs.writeFile(filePath, fileBuffer);
  }

  return {
    fileName,
    url: `/uploads/${fileName}`
  };
}

export async function readUploadedImage(pathSegments: string[]) {
  if (databaseUrl) {
    if (pathSegments.length !== 1) {
      throw new Error("Invalid upload path.");
    }

    try {
      return await readUploadedImageFromDatabase(pathSegments[0]);
    } catch (error) {
      const requestedPath = path.resolve(uploadRoot, pathSegments[0]);
      const rootWithSeparator = `${uploadRoot}${path.sep}`;

      if (
        requestedPath !== uploadRoot &&
        requestedPath.startsWith(rootWithSeparator)
      ) {
        const buffer = await fs.readFile(requestedPath);

        return {
          buffer,
          contentType: getContentType(requestedPath),
          size: buffer.byteLength
        };
      }

      throw error;
    }
  }

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
    contentType: getContentType(requestedPath),
    size: buffer.byteLength
  };
}
