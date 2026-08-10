import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  scryptSync,
  timingSafeEqual
} from "node:crypto";

import {
  maskEmail,
  validateEmailAddress,
  validateEmailCode
} from "@/features/auth/email-auth";
import {
  consumeEmailCodeOnce,
  type AtomicEmailCodeTransactionRunner
} from "@/server/security/atomic-email-code";

export const EMAIL_LOGIN_CODES_COLLECTION = "email_login_codes";
export const EMAIL_LOGIN_USERS_COLLECTION = "email_login_users";

const CODE_TTL_MS = 5 * 60 * 1000;
const SEND_COOLDOWN_MS = 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;
const MAX_PASSWORD_ATTEMPTS = 5;
const PASSWORD_LOCK_MS = 15 * 60 * 1000;
const SCRYPT_KEY_LENGTH = 64;

type RuntimeEnv = {
  APP_ENV?: string;
  AUTH_SESSION_SECRET?: string;
  EMAIL_CODE_SECRET?: string;
  NODE_ENV?: string;
};

type StoredDocument = Record<string, unknown>;

export type EmailAuthCollection = {
  doc: (docId: string) => {
    get: () => Promise<{ data?: unknown[] | Record<string, unknown> }>;
    set: (data: StoredDocument) => Promise<unknown>;
    update?: (data: StoredDocument) => Promise<unknown>;
  };
};

export type EmailDelivery = {
  send: (input: { code: string; email: string; emailMasked: string }) => Promise<
    { ok: true } | { ok: false; error: string }
  >;
};

export type EmailAuthTransactionRunner = AtomicEmailCodeTransactionRunner;

export type EmailAuthTransaction = {
  collection: (name: string) => EmailAuthCollection;
};

export type EmailAuthAtomicTransactionRunner = <T>(
  operation: (transaction: EmailAuthTransaction) => Promise<T>
) => Promise<T>;

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
  failedPasswordAttempts?: number;
  lastLoginAt: string;
  passwordHash?: string;
  passwordLockedUntil?: string;
  passwordUpdatedAt?: string;
  status: "active" | "disabled";
  userId: string;
};

type EmailAuthErrors = {
  code?: string;
  email?: string;
  password?: string;
  passwordConfirm?: string;
  request?: string;
};

type EmailAuthOperationResult =
  | { ok: false; value: null; errors: EmailAuthErrors }
  | { ok: true; value: Record<string, string | number | undefined | null>; errors: Record<string, never> };

export function hashEmail(email: string) {
  return createHash("sha256").update(email).digest("hex");
}

function readCodeSecret(env: RuntimeEnv) {
  const dedicatedSecret = env.EMAIL_CODE_SECRET?.trim();
  const isProduction = env.APP_ENV === "production" || env.NODE_ENV === "production";

  if (isProduction) {
    return dedicatedSecret || null;
  }

  const secret = dedicatedSecret || env.AUTH_SESSION_SECRET?.trim();

  if (secret) {
    return secret;
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
  if (Array.isArray(result.data)) {
    return result.data[0] as TDocument | undefined;
  }
  return result.data as TDocument | undefined;
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

function createFailure(errors: EmailAuthErrors) {
  return {
    ok: false as const,
    value: null,
    errors
  };
}

function validatePasswordInput(password: string, passwordConfirm?: string) {
  const normalized = password.trim();

  if (
    normalized.length < 8 ||
    normalized.length > 72 ||
    !/[A-Za-z]/.test(normalized) ||
    !/\d/.test(normalized)
  ) {
    return createFailure({
      password: "密码至少 8 位，并同时包含字母和数字"
    });
  }

  if (passwordConfirm !== undefined && password !== passwordConfirm) {
    return createFailure({ passwordConfirm: "两次输入的密码不一致" });
  }

  return {
    ok: true as const,
    value: normalized,
    errors: {}
  };
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password: string, storedHash: string) {
  const [scheme, salt, hash] = storedHash.split("$");

  if (scheme !== "scrypt" || !salt || !hash) {
    return false;
  }

  const actual = Buffer.from(hash, "hex");
  const expected = scryptSync(password, salt, actual.length);

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function publicUserValue(user: EmailUserDocument, lastLoginAt: string) {
  return {
    createdAt: user.createdAt,
    emailMasked: user.emailMasked,
    lastLoginAt,
    userId: user.userId
  };
}

function sanitizeEmailUserForWrite(user: EmailUserDocument) {
  const writableUser = { ...user } as EmailUserDocument & {
    _id?: unknown;
    id?: unknown;
  };

  delete writableUser._id;
  delete writableUser.id;

  return writableUser;
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
  userCollection,
  consumeCode = false,
  insideTransaction = false,
  requireTransaction = false,
  runTransaction
}: {
  code: string;
  email: string;
  emailCodeCollection: EmailAuthCollection;
  env: RuntimeEnv;
  now?: Date;
  userCollection: EmailAuthCollection;
  consumeCode?: boolean;
  insideTransaction?: boolean;
  requireTransaction?: boolean;
  runTransaction?: EmailAuthAtomicTransactionRunner;
}): Promise<EmailAuthOperationResult> {
  if (!consumeCode && !insideTransaction && (env.APP_ENV === "production" || env.NODE_ENV === "production")) {
    return createFailure({ request: "验证码原子消费暂不可用，请稍后再试" });
  }

  if (consumeCode) {
    if (!runTransaction) {
      return createFailure({ request: "验证码原子消费暂不可用，请稍后再试" });
    }

    try {
      return await runTransaction(async (transaction) => {
        const txCodes = transaction.collection(EMAIL_LOGIN_CODES_COLLECTION);
        const txUsers = transaction.collection(EMAIL_LOGIN_USERS_COLLECTION);
        const verified = await verifyEmailLoginCode({
          code,
          email,
          emailCodeCollection: txCodes,
          env,
          insideTransaction: true,
          now,
          userCollection: txUsers
        });
        if (!verified.ok) return verified;
        const emailHash = hashEmail(email.trim().toLowerCase());
        const currentCode = await readDocument<EmailCodeDocument>(txCodes, emailHash);
        if (!currentCode || currentCode.usedAt) {
          return createFailure({ request: "验证码已使用，请重新获取" });
        }
        await txCodes.doc(emailHash).set({
          ...currentCode,
          usedAt: now.toISOString()
        });
        return verified;
      });
    } catch {
      return createFailure({ request: "验证码原子消费暂不可用，请稍后再试" });
    }
  }

  if (requireTransaction && !runTransaction) {
    return createFailure({ request: "验证码原子消费暂不可用，请稍后再试" });
  }

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

  const writableUser = sanitizeEmailUserForWrite(user);

  await userCollection.doc(emailHash).set({
    ...writableUser,
    lastLoginAt: now.toISOString()
  });

  return {
    ok: true as const,
    value: publicUserValue(writableUser, now.toISOString()),
    errors: {}
  };
}

export async function markEmailLoginCodeUsed({
  email,
  emailCodeCollection,
  now = new Date(),
  requireTransaction = false,
  runTransaction
}: {
  email: string;
  emailCodeCollection: EmailAuthCollection;
  now?: Date;
  requireTransaction?: boolean;
  runTransaction?: EmailAuthTransactionRunner;
}) {
  const emailValidation = validateEmailAddress(email);

  if (!emailValidation.ok) {
    return createFailure(emailValidation.errors);
  }

  const emailHash = hashEmail(emailValidation.value);
  if (requireTransaction && !runTransaction) {
    return createFailure({ request: "验证码原子消费暂不可用，请稍后再试" });
  }

  const consumed = await consumeEmailCodeOnce({
    collection: emailCodeCollection,
    docId: emailHash,
    now,
    runTransaction
  });

  if (!consumed.ok) {
    if (consumed.reason === "already-used") {
      return createFailure({ request: "验证码已使用，请重新获取" });
    }
    if (consumed.reason === "expired") {
      return createFailure({ request: "验证码已过期，请重新获取" });
    }
    return createFailure({ request: "验证码服务暂时不可用，请稍后再试" });
  }

  return {
    ok: true as const,
    value: null,
    errors: {}
  };
}

export async function setEmailUserPassword({
  email,
  now = new Date(),
  password,
  passwordConfirm,
  userCollection
}: {
  email: string;
  now?: Date;
  password: string;
  passwordConfirm: string;
  userCollection: EmailAuthCollection;
}) {
  const emailValidation = validateEmailAddress(email);

  if (!emailValidation.ok) {
    return createFailure(emailValidation.errors);
  }

  const passwordValidation = validatePasswordInput(password, passwordConfirm);

  if (!passwordValidation.ok) {
    return passwordValidation;
  }

  const emailHash = hashEmail(emailValidation.value);
  const existingUser = await readDocument<EmailUserDocument>(
    userCollection,
    emailHash
  );

  if (!existingUser || existingUser.status === "disabled") {
    return createFailure({ request: "账号暂不可用，请稍后重试" });
  }

  const passwordHash = hashPassword(passwordValidation.value);
  const writableUser = sanitizeEmailUserForWrite(existingUser);

  await userCollection.doc(emailHash).set({
    ...writableUser,
    failedPasswordAttempts: 0,
    passwordHash,
    passwordLockedUntil: undefined,
    passwordUpdatedAt: now.toISOString()
  });

  return {
    ok: true as const,
    value: { passwordUpdatedAt: now.toISOString() },
    errors: {}
  };
}

export async function loginWithEmailPassword({
  email,
  now = new Date(),
  password,
  userCollection
}: {
  email: string;
  now?: Date;
  password: string;
  userCollection: EmailAuthCollection;
}) {
  const emailValidation = validateEmailAddress(email);

  if (!emailValidation.ok) {
    return createFailure({ request: "邮箱或密码不正确" });
  }

  const normalizedPassword = password.trim();

  if (!normalizedPassword) {
    return createFailure({ request: "邮箱或密码不正确" });
  }

  const emailHash = hashEmail(emailValidation.value);
  const existingUser = await readDocument<EmailUserDocument>(
    userCollection,
    emailHash
  );

  if (!existingUser || existingUser.status === "disabled" || !existingUser.passwordHash) {
    return createFailure({ request: "邮箱或密码不正确" });
  }

  if (
    existingUser.passwordLockedUntil &&
    new Date(existingUser.passwordLockedUntil).getTime() > now.getTime()
  ) {
    return createFailure({ request: "密码错误次数过多，请稍后再试" });
  }

  if (!verifyPassword(normalizedPassword, existingUser.passwordHash)) {
    const failedPasswordAttempts = (existingUser.failedPasswordAttempts ?? 0) + 1;
    const passwordLockedUntil =
      failedPasswordAttempts >= MAX_PASSWORD_ATTEMPTS
        ? new Date(now.getTime() + PASSWORD_LOCK_MS).toISOString()
        : undefined;

    await patchDocument(userCollection, emailHash, {
      failedPasswordAttempts,
      passwordLockedUntil
    });

    return createFailure({
      request:
        failedPasswordAttempts >= MAX_PASSWORD_ATTEMPTS
          ? "密码错误次数过多，请稍后再试"
          : "邮箱或密码不正确"
    });
  }

  const writableUser = sanitizeEmailUserForWrite(existingUser);

  await userCollection.doc(emailHash).set({
    ...writableUser,
    failedPasswordAttempts: 0,
    lastLoginAt: now.toISOString(),
    passwordLockedUntil: undefined
  });

  return {
    ok: true as const,
    value: publicUserValue(existingUser, now.toISOString()),
    errors: {}
  };
}

export async function resetEmailPasswordWithCode({
  code,
  email,
  emailCodeCollection,
  env,
  now = new Date(),
  password,
  passwordConfirm,
  userCollection,
  insideTransaction = false,
  requireTransaction = false,
  runTransaction
}: {
  code: string;
  email: string;
  emailCodeCollection: EmailAuthCollection;
  env: RuntimeEnv;
  now?: Date;
  password: string;
  passwordConfirm: string;
  userCollection: EmailAuthCollection;
  requireTransaction?: boolean;
  insideTransaction?: boolean;
  runTransaction?: EmailAuthAtomicTransactionRunner;
}): Promise<EmailAuthOperationResult> {
  if (!requireTransaction && !insideTransaction && (env.APP_ENV === "production" || env.NODE_ENV === "production")) {
    return createFailure({ request: "验证码原子消费暂不可用，请稍后再试" });
  }

  if (requireTransaction) {
    if (!runTransaction) {
      return createFailure({ request: "验证码原子消费暂不可用，请稍后再试" });
    }
    try {
      return await runTransaction((transaction) =>
        resetEmailPasswordWithCode({
          code,
          email,
          emailCodeCollection: transaction.collection(EMAIL_LOGIN_CODES_COLLECTION),
          env,
          insideTransaction: true,
          now,
          password,
          passwordConfirm,
          userCollection: transaction.collection(EMAIL_LOGIN_USERS_COLLECTION)
        })
      );
    } catch {
      return createFailure({ request: "验证码原子消费暂不可用，请稍后再试" });
    }
  }

  const verified = await verifyEmailLoginCode({
    code,
    email,
    emailCodeCollection,
    env,
    insideTransaction,
    now,
    userCollection
  });

  if (!verified.ok) {
    return verified;
  }

  const passwordResult = await setEmailUserPassword({
    email,
    now,
    password,
    passwordConfirm,
    userCollection
  });

  if (!passwordResult.ok) {
    return passwordResult;
  }

  const consumed = await markEmailLoginCodeUsed({
    email,
    emailCodeCollection,
    now
  });

  if (!consumed.ok) {
    return consumed;
  }

  return {
    ok: true as const,
    value: passwordResult.value,
    errors: {}
  };
}
