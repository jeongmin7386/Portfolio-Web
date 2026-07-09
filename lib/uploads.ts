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
  ["image/gif", ".gif"],
  ["image/heic", ".heic"],
  ["image/heic-sequence", ".heic"],
  ["image/heif", ".heif"],
  ["image/heif-sequence", ".heif"],
  ["image/svg+xml", ".svg"]
]);

const maxUploadBytes = 10 * 1024 * 1024;
const databaseUrl =
  process.env.STUDIO_ARCHIVE_DATABASE_URL ?? process.env.DATABASE_URL;

export const uploadRoot = process.env.STUDIO_ARCHIVE_UPLOAD_DIR
  ? path.resolve(process.env.STUDIO_ARCHIVE_UPLOAD_DIR)
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

function getExtension(file: File) {
  const extensionFromType = allowedTypes.get(file.type.toLowerCase());

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
    case ".avif":
      return "image/avif";
    case ".gif":
      return "image/gif";
    case ".heic":
      return "image/heic";
    case ".heif":
      return "image/heif";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
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
      content_type text not null,
      content bytea not null,
      size_bytes integer not null,
      created_at timestamptz not null default now()
    )
  `);

  uploadTableReady = true;
}

async function saveUploadedImageToDatabase(
  fileName: string,
  contentType: string,
  fileBuffer: Buffer
) {
  await ensureUploadTable();
  await getPool().query(
    `
      insert into studio_archive_uploads (
        file_name,
        content_type,
        content,
        size_bytes,
        created_at
      )
      values ($1, $2, $3, $4, now())
      on conflict (file_name)
      do update set
        content_type = excluded.content_type,
        content = excluded.content,
        size_bytes = excluded.size_bytes
    `,
    [fileName, contentType, fileBuffer, fileBuffer.byteLength]
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

export async function saveUploadedImage(file: File) {
  if (file.type && !file.type.startsWith("image/")) {
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
  const contentType = getContentType(fileName);

  if (databaseUrl) {
    await saveUploadedImageToDatabase(fileName, contentType, fileBuffer);
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
