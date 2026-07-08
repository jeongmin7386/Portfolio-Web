import crypto from "node:crypto";
import { cookies } from "next/headers";

const adminCookieName = "studio_archive_admin";
const sessionDurationSeconds = 60 * 60 * 12;

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

function createSessionToken() {
  const expiresAt = Date.now() + sessionDurationSeconds * 1000;
  const payload = String(expiresAt);
  return `${payload}.${sign(payload)}`;
}

function verifySessionToken(token: string) {
  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    return false;
  }

  const expiresAt = Number(payload);

  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
    return false;
  }

  const expectedSignature = sign(payload);
  const expectedBuffer = Buffer.from(expectedSignature);
  const actualBuffer = Buffer.from(signature);

  return (
    expectedBuffer.length === actualBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, actualBuffer)
  );
}

export function isAdminAuthEnabled() {
  return Boolean(getAdminPassword());
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

export async function getAdminSession() {
  if (!isAdminAuthEnabled()) {
    return {
      authEnabled: false,
      authenticated: true
    };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(adminCookieName)?.value;

  return {
    authEnabled: true,
    authenticated: token ? verifySessionToken(token) : false
  };
}

export async function requireAdminAccess() {
  const session = await getAdminSession();
  return session.authenticated;
}

export async function setAdminSessionCookie() {
  const cookieStore = await cookies();

  cookieStore.set(adminCookieName, createSessionToken(), {
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
