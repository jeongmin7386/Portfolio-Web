const windowMs = 10 * 60 * 1000;
const maxAttempts = 8;
const blockedMs = 15 * 60 * 1000;

type LoginAttemptState = {
  blockedUntil?: number;
  count: number;
  firstAttemptAt: number;
};

const attempts = new Map<string, LoginAttemptState>();

function now() {
  return Date.now();
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase().slice(0, 160) || "unknown";
}

export function getLoginAttemptKey(request: Request, accountHint = "") {
  const forwardedFor =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const realIp = request.headers.get("x-real-ip")?.trim() ?? "";
  const ip = forwardedFor || realIp || "unknown-ip";

  return normalizeKey(`${ip}:${accountHint}`);
}

export function assertLoginAllowed(key: string) {
  const current = now();
  const state = attempts.get(key);

  if (!state) {
    return;
  }

  if (state.blockedUntil && state.blockedUntil > current) {
    const retryAfterSeconds = Math.ceil((state.blockedUntil - current) / 1000);

    return {
      retryAfterSeconds
    };
  }

  if (current - state.firstAttemptAt > windowMs) {
    attempts.delete(key);
  }

  return;
}

export function recordLoginFailure(key: string) {
  const current = now();
  const existing = attempts.get(key);
  const state =
    existing && current - existing.firstAttemptAt <= windowMs
      ? existing
      : { count: 0, firstAttemptAt: current };

  state.count += 1;

  if (state.count >= maxAttempts) {
    state.blockedUntil = current + blockedMs;
  }

  attempts.set(key, state);
}

export function clearLoginFailures(key: string) {
  attempts.delete(key);
}

