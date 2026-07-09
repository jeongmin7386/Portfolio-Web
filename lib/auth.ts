import crypto from "node:crypto";
import { cookies } from "next/headers";

import {
  authenticateAdminUser,
  getApprovedAdminUserById,
  type PublicAdminUser
} from "@/lib/admin-users";

const adminCookieName = "studio_archive_admin";
const sessionDurationSeconds = 60 * 60 * 12;

type SessionRole = "owner" | "admin";

type SessionTokenPayload = {
  expiresAt: number;
  role: SessionRole;
  sub: string;
};

export type AdminSession = {
  authEnabled: boolean;
  authenticated: boolean;
  isOwner: boolean;
  user?: {
    email?: string;
    id: string;
    name: string;
    role: SessionRole;
  };
};

function getAdminPassword() {
  return process.env.STUDIO_ARCHIVE_ADMIN_PASSWORD?.trim();
}

function getAuthSecret() {
  return (
    process.env.STUDIO_ARCHIVE_AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    process.env.JWT_SECRET ??
    getAdminPassword() ??
    "studio-archive-development-secret"
  );
}

function sign(value: string) {
  return crypto
    .createHmac("sha256", getAuthSecret())
    .update(value)
    .digest("base64url");
}

function encodePayload(payload: SessionTokenPayload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodePayload(payload: string): SessionTokenPayload | null {
  if (/^\d+$/.test(payload)) {
    return {
      expiresAt: Number(payload),
      role: "owner",
      sub: "owner"
    };
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as Partial<SessionTokenPayload>;

    if (
      typeof parsed.expiresAt !== "number" ||
      (parsed.role !== "owner" && parsed.role !== "admin") ||
      typeof parsed.sub !== "string"
    ) {
      return null;
    }

    return {
      expiresAt: parsed.expiresAt,
      role: parsed.role,
      sub: parsed.sub
    };
  } catch {
    return null;
  }
}

function createSessionToken(user?: PublicAdminUser) {
  const payload = encodePayload({
    expiresAt: Date.now() + sessionDurationSeconds * 1000,
    role: user?.role ?? "owner",
    sub: user?.id ?? "owner"
  });

  return `${payload}.${sign(payload)}`;
}

function verifySessionToken(token: string) {
  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = sign(payload);
  const expectedBuffer = Buffer.from(expectedSignature);
  const actualBuffer = Buffer.from(signature);
  const signatureMatches =
    expectedBuffer.length === actualBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, actualBuffer);

  if (!signatureMatches) {
    return null;
  }

  const decodedPayload = decodePayload(payload);

  if (!decodedPayload || decodedPayload.expiresAt < Date.now()) {
    return null;
  }

  return decodedPayload;
}

export function isOwnerPasswordConfigured() {
  return Boolean(getAdminPassword());
}

export function isAdminAuthEnabled() {
  return true;
}

export function verifyAdminPassword(password: string) {
  const expectedPassword = getAdminPassword();

  if (!expectedPassword) {
    return false;
  }

  const expectedBuffer = Buffer.from(expectedPassword);
  const actualBuffer = Buffer.from(password);

  return (
    expectedBuffer.length === actualBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, actualBuffer)
  );
}

export async function verifyAdminAccount(email: string, password: string) {
  return authenticateAdminUser(email, password);
}

export async function getAdminSession(): Promise<AdminSession> {
  const cookieStore = await cookies();
  const token = cookieStore.get(adminCookieName)?.value;
  const payload = token ? verifySessionToken(token) : null;

  if (!payload) {
    return {
      authEnabled: true,
      authenticated: false,
      isOwner: false
    };
  }

  if (payload.sub === "owner" || payload.role === "owner") {
    return {
      authEnabled: true,
      authenticated: true,
      isOwner: true,
      user: {
        id: "owner",
        name: "사이트 소유자",
        role: "owner"
      }
    };
  }

  const user = await getApprovedAdminUserById(payload.sub);

  if (!user) {
    return {
      authEnabled: true,
      authenticated: false,
      isOwner: false
    };
  }

  return {
    authEnabled: true,
    authenticated: true,
    isOwner: user.role === "owner",
    user: {
      email: user.email,
      id: user.id,
      name: user.name,
      role: user.role
    }
  };
}

export async function requireAdminAccess() {
  const session = await getAdminSession();
  return session.authenticated;
}

export async function requireOwnerAccess() {
  const session = await getAdminSession();
  return session.authenticated && session.isOwner;
}

export function getAdminContentOwnerKey(session: AdminSession) {
  return session.isOwner ? "owner" : (session.user?.id ?? "owner");
}

export async function setAdminSessionCookie(user?: PublicAdminUser) {
  const cookieStore = await cookies();

  cookieStore.set(adminCookieName, createSessionToken(user), {
    httpOnly: true,
    maxAge: sessionDurationSeconds,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();

  cookieStore.set(adminCookieName, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });
}
