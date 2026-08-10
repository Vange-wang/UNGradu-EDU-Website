import {
  type AuthSessionRevocationGuard,
  type SessionLifecycleResult
} from "@/server/security/session-revocation";
import {
  createHmacSha256Hex,
  timingSafeEqualText
} from "@/server/security/request-guard";

export const AUTH_SESSION_COOKIE_NAME = "ungradu_auth_session";

export type AuthSessionEnv = {
  APP_ENV?: string;
  AUTH_SESSION_SECRET?: string;
  AUTH_SESSION_KEY_VERSION?: string;
  AUTH_SESSION_REVOKED_AT?: string;
  AUTH_SESSION_REVOCATION_REQUIRED?: string;
  NODE_ENV?: string;
};

export type { AuthSessionRevocationGuard } from "@/server/security/session-revocation";

export type AuthSession = {
  emailMasked?: string;
  createdAt: string;
  keyVersion?: string;
  phone?: string;
  userId?: string;
};

const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const MAX_AGE_MILLISECONDS = MAX_AGE_SECONDS * 1000;

function isProductionRuntime(env: AuthSessionEnv) {
  return env.APP_ENV === "production" || env.NODE_ENV === "production";
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function readSessionSecret(env: AuthSessionEnv) {
  const secret = env.AUTH_SESSION_SECRET?.trim();

  if (secret) {
    return secret;
  }

  if (isProductionRuntime(env)) {
    return null;
  }

  return "ungradu-dev-only-auth-session-secret";
}

function signPayload(payload: string, secret: string) {
  const hex = createHmacSha256Hex(secret, payload);
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

function parseCookieHeader(cookieHeader: string | null) {
  const cookies = new Map<string, string>();

  cookieHeader?.split(";").forEach((part) => {
    const separatorIndex = part.indexOf("=");

    if (separatorIndex === -1) {
      return;
    }

    const name = part.slice(0, separatorIndex).trim();
    const value = part.slice(separatorIndex + 1).trim();

    if (name) {
      cookies.set(name, value);
    }
  });

  return cookies;
}

function verifySignature(expected: string, actual: string) {
  return timingSafeEqualText(expected, actual);
}

export function createAuthSessionCookie({
  createdAt,
  emailMasked,
  env,
  now = new Date(),
  phone,
  userId
}: {
  createdAt?: string;
  emailMasked?: string;
  env: AuthSessionEnv;
  now?: Date;
  phone?: string;
  userId?: string;
}) {
  const secret = readSessionSecret(env);

  if (!secret) {
    return null;
  }

  const session: AuthSession = {
    createdAt: createdAt ?? now.toISOString(),
    emailMasked: emailMasked?.trim() || undefined,
    keyVersion: env.AUTH_SESSION_KEY_VERSION?.trim() || undefined,
    phone: phone?.trim() || undefined,
    userId: userId?.trim() || phone?.trim() || undefined
  };

  if (!session.userId) {
    return null;
  }

  const payload = base64UrlEncode(JSON.stringify(session));
  const signature = signPayload(payload, secret);
  const secure = isProductionRuntime(env) ? "; Secure" : "";

  return `${AUTH_SESSION_COOKIE_NAME}=${payload}.${signature}; Path=/; Max-Age=${MAX_AGE_SECONDS}; HttpOnly; SameSite=Lax${secure}`;
}

export function clearAuthSessionCookie(env: AuthSessionEnv = process.env) {
  const secure = isProductionRuntime(env) ? "; Secure" : "";
  return `${AUTH_SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`;
}

export function readAuthSessionFromRequest(
  request: Request,
  env: AuthSessionEnv,
  options: { now?: Date; revokedAt?: string } = {}
) {
  const secret = readSessionSecret(env);

  if (!secret) {
    return null;
  }

  const rawCookie = parseCookieHeader(request.headers.get("cookie")).get(
    AUTH_SESSION_COOKIE_NAME
  );

  if (!rawCookie) {
    return null;
  }

  const [payload, signature] = rawCookie.split(".");

  if (!payload || !signature) {
    return null;
  }

  if (!verifySignature(signPayload(payload, secret), signature)) {
    return null;
  }

  try {
    const session = JSON.parse(base64UrlDecode(payload)) as Partial<AuthSession>;

    if (
      !session.createdAt?.trim() ||
      (!session.userId?.trim() && !session.phone?.trim())
    ) {
      return null;
    }

    const createdAtTime = new Date(session.createdAt).getTime();
    const nowTime = (options.now ?? new Date()).getTime();

    if (
      !Number.isFinite(createdAtTime) ||
      createdAtTime > nowTime ||
      nowTime - createdAtTime > MAX_AGE_MILLISECONDS
    ) {
      return null;
    }

    const activeKeyVersion = env.AUTH_SESSION_KEY_VERSION?.trim();
    if (activeKeyVersion && session.keyVersion !== activeKeyVersion) {
      return null;
    }

    const revokedAt = options.revokedAt?.trim() || env.AUTH_SESSION_REVOKED_AT?.trim();
    if (revokedAt) {
      const revokedAtTime = new Date(revokedAt).getTime();
      if (!Number.isFinite(revokedAtTime) || createdAtTime <= revokedAtTime) {
        return null;
      }
    }

    return {
      createdAt: session.createdAt,
      emailMasked: session.emailMasked?.trim(),
      keyVersion: session.keyVersion?.trim(),
      phone: session.phone?.trim(),
      userId: session.userId?.trim() || session.phone?.trim()
    };
  } catch {
    return null;
  }
}

export async function readAuthSessionFromRequestWithRevocation(
  request: Request,
  env: AuthSessionEnv,
  guard?: AuthSessionRevocationGuard,
  options: { now?: Date } = {}
): Promise<
  | { ok: true; session: AuthSession }
  | { ok: false; reason: "missing" | "revoked" | "unavailable" }
> {
  const session = readAuthSessionFromRequest(request, env, options);
  if (!session) return { ok: false, reason: "missing" };

  const requiresRevocation = env.AUTH_SESSION_REVOCATION_REQUIRED === "true" || env.NODE_ENV === "production" || env.APP_ENV === "production";
  if (requiresRevocation && !guard) return { ok: false, reason: "unavailable" };
  if (!guard) return { ok: true, session };

  let result: SessionLifecycleResult;
  try {
    result = await guard.check({
      createdAt: session.createdAt,
      keyVersion: session.keyVersion,
      now: options.now,
      userId: session.userId ?? session.phone ?? ""
    });
  } catch {
    return { ok: false, reason: "unavailable" };
  }
  if (!result.ok) {
    return { ok: false, reason: result.reason === "revoked" ? "revoked" : "missing" };
  }

  return { ok: true, session };
}
