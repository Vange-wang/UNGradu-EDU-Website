import { createHash, createHmac, randomInt } from "node:crypto";

import {
  maskPhone,
  validateMainlandPhone,
  validateSmsCode
} from "@/features/auth/phone-auth";

export const SMS_LOGIN_CODES_COLLECTION = "sms_login_codes";
export const SMS_LOGIN_USERS_COLLECTION = "sms_login_users";

const CODE_TTL_MS = 5 * 60 * 1000;
const SEND_COOLDOWN_MS = 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;

type RuntimeEnv = {
  APP_ENV?: string;
  AUTH_SESSION_SECRET?: string;
  NODE_ENV?: string;
  SMS_CODE_SECRET?: string;
};

type StoredDocument = Record<string, unknown>;

export type SmsAuthCollection = {
  doc: (docId: string) => {
    get: () => Promise<{ data?: unknown[] }>;
    set: (data: StoredDocument) => Promise<unknown>;
    update?: (data: StoredDocument) => Promise<unknown>;
  };
};

export type SmsDelivery = {
  send: (input: { code: string; phone: string }) => Promise<{ ok: true } | {
    ok: false;
    error: string;
  }>;
};

export type SmsCodeDocument = {
  attempts: number;
  codeHash: string;
  createdAt: string;
  expiresAt: string;
  phoneHash: string;
  phoneMasked: string;
  sentAt: string;
  usedAt?: string;
};

export type SmsUserDocument = {
  createdAt: string;
  lastLoginAt: string;
  phoneHash: string;
  phoneMasked: string;
  status: "active" | "disabled";
  userId: string;
};

export function hashPhone(phone: string) {
  return createHash("sha256").update(phone).digest("hex");
}

function readCodeSecret(env: RuntimeEnv) {
  const secret = env.SMS_CODE_SECRET?.trim() || env.AUTH_SESSION_SECRET?.trim();

  if (secret) {
    return secret;
  }

  if (env.APP_ENV === "production" || env.NODE_ENV === "production") {
    return null;
  }

  return "ungradu-dev-only-sms-code-secret";
}

function hashCode({
  code,
  env,
  phone
}: {
  code: string;
  env: RuntimeEnv;
  phone: string;
}) {
  const secret = readCodeSecret(env);

  if (!secret) {
    return null;
  }

  return createHmac("sha256", secret).update(`${phone}:${code}`).digest("hex");
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
  collection: SmsAuthCollection,
  docId: string
) {
  const result = await collection.doc(docId).get();
  return result.data?.[0] as TDocument | undefined;
}

async function patchDocument(
  collection: SmsAuthCollection,
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

function createUserId(phoneHash: string) {
  return `user_${phoneHash.slice(0, 24)}`;
}

function createFailure(
  errors: { code?: string; phone?: string; request?: string }
) {
  return {
    ok: false as const,
    value: null,
    errors
  };
}

export async function sendSmsLoginCode({
  codeGenerator = generateSixDigitCode,
  env,
  now = new Date(),
  phone,
  smsCodeCollection,
  smsDelivery
}: {
  codeGenerator?: () => string;
  env: RuntimeEnv;
  now?: Date;
  phone: string;
  smsCodeCollection: SmsAuthCollection;
  smsDelivery: SmsDelivery;
}) {
  const phoneValidation = validateMainlandPhone(phone);

  if (!phoneValidation.ok) {
    return createFailure(phoneValidation.errors);
  }

  const normalizedPhone = phoneValidation.value;
  const phoneHash = hashPhone(normalizedPhone);
  const existingCode = await readDocument<SmsCodeDocument>(
    smsCodeCollection,
    phoneHash
  );

  if (
    existingCode?.sentAt &&
    now.getTime() - new Date(existingCode.sentAt).getTime() < SEND_COOLDOWN_MS
  ) {
    return createFailure({ request: "验证码发送过于频繁，请稍后再试" });
  }

  const code = normalizeGeneratedCode(codeGenerator());
  const codeHash = hashCode({ code, env, phone: normalizedPhone });

  if (!codeHash) {
    return createFailure({ request: "短信验证码密钥未配置" });
  }

  const delivery = await smsDelivery.send({ code, phone: normalizedPhone });

  if (!delivery.ok) {
    return createFailure({ request: "验证码发送失败，请稍后再试" });
  }

  const createdAt = now.toISOString();

  await smsCodeCollection.doc(phoneHash).set({
    attempts: 0,
    codeHash,
    createdAt,
    expiresAt: new Date(now.getTime() + CODE_TTL_MS).toISOString(),
    phoneHash,
    phoneMasked: maskPhone(normalizedPhone),
    sentAt: createdAt
  });

  return {
    ok: true as const,
    value: {
      expiresInSeconds: CODE_TTL_MS / 1000,
      phoneMasked: maskPhone(normalizedPhone),
      resendAfterSeconds: SEND_COOLDOWN_MS / 1000
    },
    errors: {}
  };
}

export async function verifySmsLoginCode({
  code,
  env,
  now = new Date(),
  phone,
  smsCodeCollection,
  userCollection
}: {
  code: string;
  env: RuntimeEnv;
  now?: Date;
  phone: string;
  smsCodeCollection: SmsAuthCollection;
  userCollection: SmsAuthCollection;
}) {
  const phoneValidation = validateMainlandPhone(phone);

  if (!phoneValidation.ok) {
    return createFailure(phoneValidation.errors);
  }

  const codeValidation = validateSmsCode(code);

  if (!codeValidation.ok) {
    return createFailure(codeValidation.errors);
  }

  const normalizedPhone = phoneValidation.value;
  const phoneHash = hashPhone(normalizedPhone);
  const storedCode = await readDocument<SmsCodeDocument>(
    smsCodeCollection,
    phoneHash
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
    env,
    phone: normalizedPhone
  });

  if (!incomingCodeHash) {
    return createFailure({ request: "短信验证码密钥未配置" });
  }

  if (incomingCodeHash !== storedCode.codeHash) {
    const attempts = storedCode.attempts + 1;
    await patchDocument(smsCodeCollection, phoneHash, { attempts });

    if (attempts >= MAX_VERIFY_ATTEMPTS) {
      return createFailure({ request: "验证码错误次数过多，请重新获取" });
    }

    return createFailure({ code: "验证码不正确" });
  }

  await patchDocument(smsCodeCollection, phoneHash, {
    attempts: storedCode.attempts,
    usedAt: now.toISOString()
  });

  const existingUser = await readDocument<SmsUserDocument>(
    userCollection,
    phoneHash
  );

  if (existingUser?.status === "disabled") {
    return createFailure({ request: "账号暂不可用，请联系平台处理" });
  }

  const user: SmsUserDocument = existingUser ?? {
    createdAt: now.toISOString(),
    lastLoginAt: now.toISOString(),
    phoneHash,
    phoneMasked: maskPhone(normalizedPhone),
    status: "active",
    userId: createUserId(phoneHash)
  };

  await userCollection.doc(phoneHash).set({
    ...user,
    lastLoginAt: now.toISOString()
  });

  return {
    ok: true as const,
    value: {
      createdAt: user.createdAt,
      lastLoginAt: now.toISOString(),
      phone: normalizedPhone,
      phoneMasked: user.phoneMasked,
      userId: user.userId
    },
    errors: {}
  };
}
