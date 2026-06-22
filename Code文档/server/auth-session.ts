import { createHmac, timingSafeEqual } from "node:crypto";

export const AUTH_SESSION_COOKIE_NAME = "ungradu_auth_session";

export type AuthSessionEnv = {
  AUTH_SESSION_SECRET?: string;
  NODE_ENV?: string;
};

export type AuthSession = {
  phone: string;
  createdAt: string;
};

const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

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

  if (env.NODE_ENV === "production") {
    return null;
  }

  return "ungradu-dev-only-auth-session-secret";
}

function signPayload(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
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
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);

  return expectedBuffer.length === actualBuffer.length &&
    timingSafeEqual(expectedBuffer, actualBuffer);
}

export function createAuthSessionCookie({
  env,
  phone
}: {
  env: AuthSessionEnv;
  phone: string;
}) {
  const secret = readSessionSecret(env);

  if (!secret) {
    return null;
  }

  const session: AuthSession = {
    phone: phone.trim(),
    createdAt: new Date().toISOString()
  };
  const payload = base64UrlEncode(JSON.stringify(session));
  const signature = signPayload(payload, secret);
  const secure = env.NODE_ENV === "production" ? "; Secure" : "";

  return `${AUTH_SESSION_COOKIE_NAME}=${payload}.${signature}; Path=/; Max-Age=${MAX_AGE_SECONDS}; HttpOnly; SameSite=Lax${secure}`;
}

export function clearAuthSessionCookie() {
  return `${AUTH_SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`;
}

export function readAuthSessionFromRequest(
  request: Request,
  env: AuthSessionEnv
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

    if (!session.phone?.trim() || !session.createdAt?.trim()) {
      return null;
    }

    return {
      phone: session.phone.trim(),
      createdAt: session.createdAt
    };
  } catch {
    return null;
  }
}
