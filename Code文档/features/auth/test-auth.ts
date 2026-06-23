import type { KeyValueStorage } from "@/lib/storage";

type TestLoginInput = {
  phone: string;
  code: string;
};

type TestLoginSuccess = {
  ok: true;
  value: TestLoginInput;
  errors: Record<string, never>;
};

type TestLoginFailure = {
  ok: false;
  value: null;
  errors: {
    phone?: string;
    code?: string;
  };
};

export type TestLoginValidation = TestLoginSuccess | TestLoginFailure;

export type TestSession = {
  phone: string;
  createdAt: string;
};

const TEST_SESSION_KEY = "ungradu.testSession";
const MAINLAND_PHONE_PATTERN = /^1[3-9]\d{9}$/;
const TEST_CODE = "000000";

export function isTestLoginAllowed({
  allowTestLogin,
  allowHostedTestLogin,
  appEnv,
  nodeEnv
}: {
  allowTestLogin?: string;
  allowHostedTestLogin?: string;
  appEnv?: string;
  nodeEnv?: string;
}) {
  if (appEnv === "production") {
    return false;
  }

  if (nodeEnv === "production") {
    return appEnv === "test" && allowHostedTestLogin === "true";
  }

  return nodeEnv === "development" || allowTestLogin === "true";
}

export function validateTestLoginInput(input: TestLoginInput): TestLoginValidation {
  const phone = input.phone.trim();
  const code = input.code.trim();

  if (!MAINLAND_PHONE_PATTERN.test(phone)) {
    return {
      ok: false,
      value: null,
      errors: { phone: "请填写有效的 11 位手机号" }
    };
  }

  if (code !== TEST_CODE) {
    return {
      ok: false,
      value: null,
      errors: { code: "本地测试验证码为 000000" }
    };
  }

  return {
    ok: true,
    value: { phone, code },
    errors: {}
  };
}

export function createTestSession(
  input: { phone: string },
  storage: KeyValueStorage
): TestSession {
  const session = {
    phone: input.phone.trim(),
    createdAt: new Date().toISOString()
  };

  storage.setItem(TEST_SESSION_KEY, JSON.stringify(session));
  return session;
}

export function readTestSession(storage: KeyValueStorage): TestSession | null {
  const rawSession = storage.getItem(TEST_SESSION_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    const session = JSON.parse(rawSession) as TestSession;

    if (!session.phone || !session.createdAt) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export function clearTestSession(storage: KeyValueStorage) {
  storage.removeItem(TEST_SESSION_KEY);
}
