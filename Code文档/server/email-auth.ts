import { createHash, createHmac, randomInt } from "node:crypto";

import {
  maskEmail,
  validateEmailAddress,
  validateEmailCode
} from "@/features/auth/email-auth";

export const EMAIL_LOGIN_CODES_COLLECTION = "email_login_codes";
export const EMAIL_LOGIN_USERS_COLLECTION = "email_login_users";

const CODE_TTL_MS = 5 * 60 * 1000;
const SEND_COOLDOWN_MS = 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;

type RuntimeEnv = {
  APP_ENV?: string;
  AUTH_SESSION_SECRET?: string;
  EMAIL_CODE_SECRET?: string;
  NODE_ENV?: string;
};

type StoredDocument = Record<string, unknown>;

export type EmailAuthCollection = {
  doc: (docId: string) => {
    get: () => Promise<{ data?: unknown[] }>;
    set: (data: StoredDocument) => Promise<unknown>;
    update?: (data: StoredDocument) => Promise<unknown>;
  };
};

export type EmailDelivery = {
  send: (input: { code: string; email: string; emailMasked: string }) => Promise<
    { ok: true } | { ok: false; error: string }
  >;
};

export type EmailCodeDocument = {
  attempts: number;
  codeHash: string;
  createdAt: string;
  emailHash: string;
  emailMasked: string;
  expiresAt: string;
  sentAt: string;
  usedAt?: string;
};

export type EmailUserDocument = {
  createdAt: string;
  emailHash: string;
  emailMasked: string;
  lastLoginAt: string;
  status: "active" | "disabled";
  userId: string;
};

export function hashEmail(email: string) {
  return createHash("sha256").update(email).digest("hex");
}

function readCodeSecret(env: RuntimeEnv) {
  const secret = env.EMAIL_CODE_SECRET?.trim() || env.AUTH_SESSION_SECRET?.trim();

  if (secret) {
    return secret;
  }

  if (env.APP_ENV === "production" || env.NODE_ENV === "production") {
    return null;
  }

  return "ungradu-dev-only-email-code-secret";
}

function hashCode({
  code,
  email,
  env
}: {
  code: string;
  email: string;
  env: RuntimeEnv;
}) {
  const secret = readCodeSecret(env);

  if (!secret) {
    return null;
  }

  return createHmac("sha256", secret).update(`${email}:${code}`).digest("hex");
}

function generateSixDigitCode() {
  return String(randomInt(100000, 1000000));
}

function normalizeGeneratedCode(code: string) {
  const normalized = code.trim();

  if (/^\d{6}$/.test(normalized) && normalized !== "000000") {
    return normalized;
  }

  return "100001";
}

async function readDocument<TDocument>(
  collection: EmailAuthCollection,
  docId: string
) {
  const result = await collection.doc(docId).get();
  return result.data?.[0] as TDocument | undefined;
}

async function patchDocument(
  collection: EmailAuthCollection,
  docId: string,
  data: StoredDocument
) {
  const document = collection.doc(docId);

  if (document.update) {
    await document.update(data);
    return;
  }

  const current = await readDocument<StoredDocument>(collection, docId);
  await document.set({ ...(current ?? {}), ...data });
}

function createUserId(emailHash: string) {
  return `email_${emailHash.slice(0, 24)}`;
}

function createFailure(
  errors: { code?: string; email?: string; request?: string }
) {
  return {
    ok: false as const,
    value: null,
    errors
  };
}

export async function sendEmailLoginCode({
  codeGenerator = generateSixDigitCode,
  email,
  emailCodeCollection,
  emailDelivery,
  env,
  now = new Date()
}: {
  codeGenerator?: () => string;
  email: string;
  emailCodeCollection: EmailAuthCollection;
  emailDelivery: EmailDelivery;
  env: RuntimeEnv;
  now?: Date;
}) {
  const emailValidation = validateEmailAddress(email);

  if (!emailValidation.ok) {
    return createFailure(emailValidation.errors);
  }

  const normalizedEmail = emailValidation.value;
  const emailHash = hashEmail(normalizedEmail);
  const existingCode = await readDocument<EmailCodeDocument>(
    emailCodeCollection,
    emailHash
  );

  if (
    existingCode?.sentAt &&
    now.getTime() - new Date(existingCode.sentAt).getTime() < SEND_COOLDOWN_MS
  ) {
    return createFailure({ request: "验证码发送过于频繁，请稍后再试" });
  }

  const code = normalizeGeneratedCode(codeGenerator());
  const codeHash = hashCode({ code, email: normalizedEmail, env });

  if (!codeHash) {
    return createFailure({ request: "邮箱验证码密钥未配置" });
  }

  const emailMasked = maskEmail(normalizedEmail);
  const delivery = await emailDelivery.send({
    code,
    email: normalizedEmail,
    emailMasked
  });

  if (!delivery.ok) {
    return createFailure({ request: "邮箱验证码发送失败，请稍后再试" });
  }

  const createdAt = now.toISOString();

  await emailCodeCollection.doc(emailHash).set({
    attempts: 0,
    codeHash,
    createdAt,
    emailHash,
    emailMasked,
    expiresAt: new Date(now.getTime() + CODE_TTL_MS).toISOString(),
    sentAt: createdAt
  });

  return {
    ok: true as const,
    value: {
      emailMasked,
      expiresInSeconds: CODE_TTL_MS / 1000,
      resendAfterSeconds: SEND_COOLDOWN_MS / 1000
    },
    errors: {}
  };
}

export async function verifyEmailLoginCode({
  code,
  email,
  emailCodeCollection,
  env,
  now = new Date(),
  userCollection
}: {
  code: string;
  email: string;
  emailCodeCollection: EmailAuthCollection;
  env: RuntimeEnv;
  now?: Date;
  userCollection: EmailAuthCollection;
}) {
  const emailValidation = validateEmailAddress(email);

  if (!emailValidation.ok) {
    return createFailure(emailValidation.errors);
  }

  const codeValidation = validateEmailCode(code);

  if (!codeValidation.ok) {
    return createFailure(codeValidation.errors);
  }

  const normalizedEmail = emailValidation.value;
  const emailHash = hashEmail(normalizedEmail);
  const storedCode = await readDocument<EmailCodeDocument>(
    emailCodeCollection,
    emailHash
  );

  if (!storedCode) {
    return createFailure({ request: "请先获取验证码" });
  }

  if (storedCode.usedAt) {
    return createFailure({ request: "验证码已使用，请重新获取" });
  }

  if (new Date(storedCode.expiresAt).getTime() <= now.getTime()) {
    return createFailure({ request: "验证码已过期，请重新获取" });
  }

  if (storedCode.attempts >= MAX_VERIFY_ATTEMPTS) {
    return createFailure({ request: "验证码错误次数过多，请重新获取" });
  }

  const incomingCodeHash = hashCode({
    code: codeValidation.value,
    email: normalizedEmail,
    env
  });

  if (!incomingCodeHash) {
    return createFailure({ request: "邮箱验证码密钥未配置" });
  }

  if (incomingCodeHash !== storedCode.codeHash) {
    const attempts = storedCode.attempts + 1;
    await patchDocument(emailCodeCollection, emailHash, { attempts });

    if (attempts >= MAX_VERIFY_ATTEMPTS) {
      return createFailure({ request: "验证码错误次数过多，请重新获取" });
    }

    return createFailure({ code: "验证码不正确" });
  }

  await patchDocument(emailCodeCollection, emailHash, {
    attempts: storedCode.attempts,
    usedAt: now.toISOString()
  });

  const existingUser = await readDocument<EmailUserDocument>(
    userCollection,
    emailHash
  );

  if (existingUser?.status === "disabled") {
    return createFailure({ request: "账号暂不可用，请联系平台处理" });
  }

  const user: EmailUserDocument = existingUser ?? {
    createdAt: now.toISOString(),
    emailHash,
    emailMasked: maskEmail(normalizedEmail),
    lastLoginAt: now.toISOString(),
    status: "active",
    userId: createUserId(emailHash)
  };

  await userCollection.doc(emailHash).set({
    ...user,
    lastLoginAt: now.toISOString()
  });

  return {
    ok: true as const,
    value: {
      createdAt: user.createdAt,
      emailMasked: user.emailMasked,
      lastLoginAt: now.toISOString(),
      userId: user.userId
    },
    errors: {}
  };
}
