import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { Pool, type PoolConfig } from "pg";

export type AdminUserRole = "owner" | "admin";
export type AdminUserStatus = "pending" | "approved" | "rejected";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  requestedAt: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type PublicAdminUser = Omit<AdminUser, "passwordHash">;

type CreateAdminAccessRequestInput = {
  email: string;
  name: string;
  password: string;
};

type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  requestedAt: Date | string;
  approvedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export class AdminUserError extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message);
  }
}

const dataRoot = process.env.STUDIO_ARCHIVE_DATA_DIR
  ? path.resolve(process.env.STUDIO_ARCHIVE_DATA_DIR)
  : path.join(process.cwd(), "data");
const adminUsersPath = path.join(dataRoot, "studio-archive-admin-users.json");
const databaseUrl =
  process.env.STUDIO_ARCHIVE_DATABASE_URL ?? process.env.DATABASE_URL;
const reservedAdminUsernames = new Set([
  "about",
  "admin",
  "api",
  "archive",
  "login",
  "projects",
  "u",
  "uploads"
]);

let pool: Pool | undefined;
let adminUsersTableReady = false;
let invalidApprovedUsersCleaned = false;

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

async function ensureAdminUsersTable() {
  if (adminUsersTableReady) {
    return;
  }

  await getPool().query(`
    create table if not exists studio_archive_admin_users (
      id text primary key,
      name text not null,
      email text unique not null,
      password_hash text not null,
      role text not null default 'admin',
      status text not null default 'pending',
      requested_at timestamptz not null default now(),
      approved_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);

  adminUsersTableReady = true;
}

function getStorageMode() {
  return databaseUrl ? "database" : "file";
}

function toIso(value: Date | string | null | undefined) {
  if (!value) {
    return undefined;
  }

  return value instanceof Date ? value.toISOString() : value;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidAdminUsername(name: string) {
  const normalizedName = name.trim().toLowerCase();

  return (
    /^[a-z][a-z0-9_-]{2,31}$/i.test(normalizedName) &&
    !reservedAdminUsernames.has(normalizedName)
  );
}

function normalizeAdminUsername(name: string) {
  return name.trim().toLowerCase();
}

function sanitizeUser(user: AdminUser): PublicAdminUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    requestedAt: user.requestedAt,
    approvedAt: user.approvedAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

function normalizeUser(user: AdminUser): AdminUser {
  return {
    ...user,
    email: normalizeEmail(user.email),
    role: user.role ?? "admin",
    status: user.status ?? "pending",
    requestedAt: user.requestedAt ?? new Date().toISOString(),
    createdAt: user.createdAt ?? new Date().toISOString(),
    updatedAt: user.updatedAt ?? new Date().toISOString()
  };
}

function sortUsers(users: AdminUser[]) {
  const statusOrder: Record<AdminUserStatus, number> = {
    pending: 0,
    approved: 1,
    rejected: 2
  };

  return [...users].sort((a, b) => {
    const statusDelta = statusOrder[a.status] - statusOrder[b.status];

    if (statusDelta) {
      return statusDelta;
    }

    return (
      new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
    );
  });
}

function mapRow(row: AdminUserRow): AdminUser {
  return normalizeUser({
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.passwordHash,
    role: row.role,
    status: row.status,
    requestedAt: toIso(row.requestedAt) ?? new Date().toISOString(),
    approvedAt: toIso(row.approvedAt),
    createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
    updatedAt: toIso(row.updatedAt) ?? new Date().toISOString()
  });
}

async function readFileUsers(): Promise<AdminUser[]> {
  try {
    const file = await fs.readFile(adminUsersPath, "utf8");
    const users = JSON.parse(file) as AdminUser[];
    return sortUsers(users.map(normalizeUser));
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;

    if (nodeError.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function saveFileUsers(users: AdminUser[]) {
  const nextUsers = sortUsers(users.map(normalizeUser));

  await fs.mkdir(dataRoot, { recursive: true });
  await fs.writeFile(
    adminUsersPath,
    JSON.stringify(nextUsers, null, 2),
    "utf8"
  );

  return nextUsers;
}

async function readDatabaseUsers(): Promise<AdminUser[]> {
  await ensureAdminUsersTable();

  const result = await getPool().query<AdminUserRow>(`
    select
      id,
      name,
      email,
      password_hash as "passwordHash",
      role,
      status,
      requested_at as "requestedAt",
      approved_at as "approvedAt",
      created_at as "createdAt",
      updated_at as "updatedAt"
    from studio_archive_admin_users
  `);

  return sortUsers(result.rows.map(mapRow));
}

async function findDatabaseUserByEmail(email: string) {
  await ensureAdminUsersTable();

  const result = await getPool().query<AdminUserRow>(
    `
      select
        id,
        name,
        email,
        password_hash as "passwordHash",
        role,
        status,
        requested_at as "requestedAt",
        approved_at as "approvedAt",
        created_at as "createdAt",
        updated_at as "updatedAt"
      from studio_archive_admin_users
      where email = $1
    `,
    [normalizeEmail(email)]
  );

  return result.rows[0] ? mapRow(result.rows[0]) : undefined;
}

async function findDatabaseUserById(id: string) {
  await ensureAdminUsersTable();

  const result = await getPool().query<AdminUserRow>(
    `
      select
        id,
        name,
        email,
        password_hash as "passwordHash",
        role,
        status,
        requested_at as "requestedAt",
        approved_at as "approvedAt",
        created_at as "createdAt",
        updated_at as "updatedAt"
      from studio_archive_admin_users
      where id = $1
    `,
    [id]
  );

  return result.rows[0] ? mapRow(result.rows[0]) : undefined;
}

async function upsertDatabaseUser(user: AdminUser) {
  await ensureAdminUsersTable();

  const nextUser = normalizeUser(user);

  await getPool().query(
    `
      insert into studio_archive_admin_users (
        id,
        name,
        email,
        password_hash,
        role,
        status,
        requested_at,
        approved_at,
        created_at,
        updated_at
      )
      values ($1, $2, $3, $4, $5, $6, $7::timestamptz, $8::timestamptz, $9::timestamptz, $10::timestamptz)
      on conflict (email)
      do update set
        name = excluded.name,
        password_hash = excluded.password_hash,
        status = excluded.status,
        requested_at = excluded.requested_at,
        approved_at = excluded.approved_at,
        updated_at = excluded.updated_at
    `,
    [
      nextUser.id,
      nextUser.name,
      nextUser.email,
      nextUser.passwordHash,
      nextUser.role,
      nextUser.status,
      nextUser.requestedAt,
      nextUser.approvedAt ?? null,
      nextUser.createdAt,
      nextUser.updatedAt
    ]
  );

  return nextUser;
}

async function updateDatabaseUserStatus(
  id: string,
  status: AdminUserStatus
) {
  await ensureAdminUsersTable();

  const approvedAt = status === "approved" ? new Date().toISOString() : null;
  const result = await getPool().query<AdminUserRow>(
    `
      update studio_archive_admin_users
      set
        status = $2,
        approved_at = $3::timestamptz,
        updated_at = now()
      where id = $1
      returning
        id,
        name,
        email,
        password_hash as "passwordHash",
        role,
        status,
        requested_at as "requestedAt",
        approved_at as "approvedAt",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `,
    [id, status, approvedAt]
  );

  const user = result.rows[0];

  if (!user) {
    throw new AdminUserError("계정을 찾지 못했습니다.", 404);
  }

  return mapRow(user);
}

async function deleteDatabaseInvalidApprovedUsers() {
  await ensureAdminUsersTable();

  await getPool().query(`
    delete from studio_archive_admin_users
    where status = 'approved'
      and name !~* '^[a-z][a-z0-9_-]{2,31}$'
  `);
}

async function deleteFileInvalidApprovedUsers() {
  const users = await readFileUsers();
  const nextUsers = users.filter(
    (user) => user.status !== "approved" || isValidAdminUsername(user.name)
  );

  if (nextUsers.length !== users.length) {
    await saveFileUsers(nextUsers);
  }
}

async function deleteInvalidApprovedAdminUsers() {
  if (invalidApprovedUsersCleaned) {
    return;
  }

  if (getStorageMode() === "database") {
    await deleteDatabaseInvalidApprovedUsers();
    invalidApprovedUsersCleaned = true;
    return;
  }

  await deleteFileInvalidApprovedUsers();
  invalidApprovedUsersCleaned = true;
}

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("base64url");
  const hash = crypto.scryptSync(password, salt, 64).toString("base64url");

  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password: string, passwordHash: string) {
  const [algorithm, salt, expectedHash] = passwordHash.split(":");

  if (algorithm !== "scrypt" || !salt || !expectedHash) {
    return false;
  }

  const actualHash = crypto.scryptSync(password, salt, 64).toString("base64url");
  const expectedBuffer = Buffer.from(expectedHash);
  const actualBuffer = Buffer.from(actualHash);

  return (
    expectedBuffer.length === actualBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, actualBuffer)
  );
}

function validateAccessRequest(input: CreateAdminAccessRequestInput) {
  const email = normalizeEmail(input.email);
  const name = normalizeAdminUsername(input.name);

  if (!name) {
    throw new AdminUserError("영문 사용자 이름을 입력해주세요.");
  }

  if (!isValidAdminUsername(name)) {
    throw new AdminUserError(
      "사용자 이름은 영문으로 시작하고, 영문·숫자·하이픈·언더스코어만 사용할 수 있습니다. 3~32자로 입력해주세요. admin, api 같은 시스템 이름은 사용할 수 없습니다."
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AdminUserError("이메일 형식이 올바르지 않습니다.");
  }

  if (input.password.length < 8) {
    throw new AdminUserError("비밀번호는 8자 이상으로 입력해주세요.");
  }

  return { email, name };
}

export async function listAdminUsers(): Promise<PublicAdminUser[]> {
  await deleteInvalidApprovedAdminUsers();

  const users =
    getStorageMode() === "database" ? await readDatabaseUsers() : await readFileUsers();

  return users.map(sanitizeUser);
}

export async function createAdminAccessRequest(
  input: CreateAdminAccessRequestInput
): Promise<PublicAdminUser> {
  const { email, name } = validateAccessRequest(input);
  const now = new Date().toISOString();
  const passwordHash = hashPassword(input.password);

  if (getStorageMode() === "database") {
    await deleteInvalidApprovedAdminUsers();

    const users = await readDatabaseUsers();
    const duplicateName = users.find(
      (user) =>
        user.name === name &&
        user.email !== email &&
        user.status !== "rejected"
    );

    if (duplicateName) {
      throw new AdminUserError("이미 사용 중인 사용자 이름입니다.", 409);
    }

    const existingUser = await findDatabaseUserByEmail(email);

    if (existingUser?.status === "approved") {
      throw new AdminUserError("이미 승인된 계정입니다.", 409);
    }

    if (existingUser?.status === "pending") {
      throw new AdminUserError("이미 승인 대기 중인 계정입니다.", 409);
    }

    const user = await upsertDatabaseUser({
      id: existingUser?.id ?? crypto.randomUUID(),
      name,
      email,
      passwordHash,
      role: "admin",
      status: "pending",
      requestedAt: now,
      createdAt: existingUser?.createdAt ?? now,
      updatedAt: now
    });

    return sanitizeUser(user);
  }

  const users = await readFileUsers();
  const duplicateName = users.find(
    (user) =>
      user.name === name &&
      user.email !== email &&
      user.status !== "rejected"
  );

  if (duplicateName) {
    throw new AdminUserError("이미 사용 중인 사용자 이름입니다.", 409);
  }

  const existingUser = users.find((user) => user.email === email);

  if (existingUser?.status === "approved") {
    throw new AdminUserError("이미 승인된 계정입니다.", 409);
  }

  if (existingUser?.status === "pending") {
    throw new AdminUserError("이미 승인 대기 중인 계정입니다.", 409);
  }

  const nextUser: AdminUser = {
    id: existingUser?.id ?? crypto.randomUUID(),
    name,
    email,
    passwordHash,
    role: "admin",
    status: "pending",
    requestedAt: now,
    createdAt: existingUser?.createdAt ?? now,
    updatedAt: now
  };

  const nextUsers = existingUser
    ? users.map((user) => (user.email === email ? nextUser : user))
    : [...users, nextUser];

  await saveFileUsers(nextUsers);

  return sanitizeUser(nextUser);
}

export async function authenticateAdminUser(
  email: string,
  password: string
): Promise<PublicAdminUser> {
  await deleteInvalidApprovedAdminUsers();

  const normalizedEmail = normalizeEmail(email);
  const user =
    getStorageMode() === "database"
      ? await findDatabaseUserByEmail(normalizedEmail)
      : (await readFileUsers()).find(
          (currentUser) => currentUser.email === normalizedEmail
        );

  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new AdminUserError("이메일 또는 비밀번호가 올바르지 않습니다.", 401);
  }

  if (user.status === "pending") {
    throw new AdminUserError("아직 승인 대기 중인 계정입니다.", 403);
  }

  if (user.status === "rejected") {
    throw new AdminUserError("승인되지 않은 계정입니다.", 403);
  }

  if (!isValidAdminUsername(user.name)) {
    throw new AdminUserError(
      "영문 사용자 이름이 필요한 계정입니다. 새 사용자 이름으로 다시 신청해주세요.",
      403
    );
  }

  return sanitizeUser(user);
}

export async function getApprovedAdminUserById(
  id: string
): Promise<PublicAdminUser | undefined> {
  await deleteInvalidApprovedAdminUsers();

  const user =
    getStorageMode() === "database"
      ? await findDatabaseUserById(id)
      : (await readFileUsers()).find((currentUser) => currentUser.id === id);

  if (!user || user.status !== "approved" || !isValidAdminUsername(user.name)) {
    return undefined;
  }

  return sanitizeUser(user);
}

export async function updateAdminUserStatus(
  id: string,
  status: AdminUserStatus
): Promise<PublicAdminUser> {
  if (status !== "approved" && status !== "rejected") {
    throw new AdminUserError("지원하지 않는 계정 상태입니다.");
  }

  if (getStorageMode() === "database") {
    const user = await findDatabaseUserById(id);

    if (!user) {
      throw new AdminUserError("계정을 찾지 못했습니다.", 404);
    }

    if (status === "approved" && !isValidAdminUsername(user.name)) {
      throw new AdminUserError(
        "영문 사용자 이름이 아닌 계정은 승인할 수 없습니다. 다시 신청하도록 안내해주세요."
      );
    }

    return sanitizeUser(await updateDatabaseUserStatus(id, status));
  }

  const users = await readFileUsers();
  const user = users.find((currentUser) => currentUser.id === id);

  if (!user) {
    throw new AdminUserError("계정을 찾지 못했습니다.", 404);
  }

  if (status === "approved" && !isValidAdminUsername(user.name)) {
    throw new AdminUserError(
      "영문 사용자 이름이 아닌 계정은 승인할 수 없습니다. 다시 신청하도록 안내해주세요."
    );
  }

  const now = new Date().toISOString();
  const nextUser: AdminUser = {
    ...user,
    status,
    approvedAt: status === "approved" ? now : undefined,
    updatedAt: now
  };

  await saveFileUsers(
    users.map((currentUser) =>
      currentUser.id === id ? nextUser : currentUser
    )
  );

  return sanitizeUser(nextUser);
}
