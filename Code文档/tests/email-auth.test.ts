import { describe, expect, it } from "vitest";

import { createAuthSessionCookie, readAuthSessionFromRequest } from "@/server/auth-session";
import { createContactProfileApiHandlers } from "@/server/contact-profile-api";
import { createEmailAuthApiHandlers } from "@/server/email-auth-api";
import { hashEmail } from "@/server/email-auth";
import { createLayeredRateLimiter } from "@/server/security/rate-limit";
import { createCsrfProof } from "@/server/security/request-guard";

type StoredDocument = Record<string, unknown>;

function createFakeCollection(initialValues: Record<string, StoredDocument> = {}) {
  const documents = new Map(Object.entries(initialValues));

  return {
    documents,
    doc(docId: string) {
      return {
        async get() {
          const data = documents.get(docId);
          return { data: data ? [{ ...data, id: docId }] : [] };
        },
        async set(data: StoredDocument) {
          if ("_id" in data) {
            throw new Error("不能更新 _id 的值");
          }

          documents.set(docId, data);
          return { updated: 1 };
        },
        async update(data: StoredDocument) {
          if ("_id" in data) {
            throw new Error("不能更新 _id 的值");
          }

          const current = documents.get(docId) ?? {};
          documents.set(docId, { ...current, ...data });
          return { updated: 1 };
        }
      };
    }
  };
}

function createHandlers(options: {
  code?: string;
  now?: Date;
  sentCodes?: string[];
} = {}) {
  const sentCodes = options.sentCodes ?? [];

  return createEmailAuthApiHandlers({
    codeGenerator: () => options.code ?? "123456",
    emailCodeCollection: createFakeCollection(),
    emailDelivery: {
      async send({ code }) {
        sentCodes.push(code);
        return { ok: true };
      }
    },
    env: {
      APP_ENV: "test",
      AUTH_SESSION_SECRET: "email-auth-test-secret",
      EMAIL_CODE_SECRET: "email-code-test-secret",
      NODE_ENV: "test"
    },
    now: () => options.now ?? new Date("2026-06-27T10:00:00.000Z"),
    userCollection: createFakeCollection()
  });
}

async function sendCode(
  handlers: ReturnType<typeof createEmailAuthApiHandlers>,
  email = "student@example.com"
) {
  return handlers.POST_SEND_CODE(
    new Request("http://localhost/api/auth/email/send-code", {
      body: JSON.stringify({ email }),
      headers: {
        "content-type": "application/json",
        origin: "https://ungraduedu.eu.cc",
        "x-ungrade-csrf": createCsrfProof({
          method: "POST",
          origin: "https://ungraduedu.eu.cc",
          secret: "email-csrf-test-secret",
          subjectId: email
        })
      },
      method: "POST"
    })
  );
}

async function login(
  handlers: ReturnType<typeof createEmailAuthApiHandlers>,
  code = "123456",
  email = "student@example.com"
) {
  return handlers.POST_LOGIN(
    new Request("http://localhost/api/auth/email/login", {
      body: JSON.stringify({ code, email }),
      headers: {
        "content-type": "application/json",
        origin: "https://ungraduedu.eu.cc",
        "x-ungrade-csrf": createCsrfProof({
          method: "POST",
          origin: "https://ungraduedu.eu.cc",
          secret: "email-csrf-test-secret",
          subjectId: email
        })
      },
      method: "POST"
    })
  );
}

async function passwordLogin(
  handlers: ReturnType<typeof createEmailAuthApiHandlers>,
  password = "Tutor12345",
  email = "student@example.com"
) {
  return handlers.POST_PASSWORD_LOGIN(
    new Request("http://localhost/api/auth/password/login", {
      body: JSON.stringify({ email, password }),
      headers: { "content-type": "application/json" },
      method: "POST"
    })
  );
}

async function setPassword(
  handlers: ReturnType<typeof createEmailAuthApiHandlers>,
  cookie: string,
  password = "Tutor12345",
  passwordConfirm = password,
  email = "student@example.com"
) {
  return handlers.POST_SET_PASSWORD(
    new Request("http://localhost/api/auth/password/set", {
      body: JSON.stringify({ email, password, passwordConfirm }),
      headers: { "content-type": "application/json", cookie },
      method: "POST"
    })
  );
}

async function resetPassword(
  handlers: ReturnType<typeof createEmailAuthApiHandlers>,
  code = "123456",
  password = "Tutor67890",
  passwordConfirm = password,
  email = "student@example.com"
) {
  return handlers.POST_RESET_PASSWORD(
    new Request("http://localhost/api/auth/password/reset", {
      body: JSON.stringify({ code, email, password, passwordConfirm }),
      headers: { "content-type": "application/json" },
      method: "POST"
    })
  );
}

describe("email auth API handlers", () => {
  it("rejects invalid email addresses before sending a login code", async () => {
    const handlers = createHandlers();
    const response = await sendCode(handlers, "not-email");

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      errors: { email: "请填写有效的邮箱地址" }
    });
  });

  it("sends a one-time email code without returning the code or full email", async () => {
    const sentCodes: string[] = [];
    const handlers = createHandlers({ sentCodes });

    const response = await sendCode(handlers);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(sentCodes).toEqual(["123456"]);
    expect(JSON.stringify(body)).not.toContain("123456");
    expect(JSON.stringify(body)).not.toContain("student@example.com");
    expect(body).toMatchObject({
      ok: true,
      value: { emailMasked: "s***t@example.com" }
    });
  });

  it("does not issue the old fixed test code even if the generator returns it", async () => {
    const sentCodes: string[] = [];
    const handlers = createHandlers({ code: "000000", sentCodes });

    await sendCode(handlers);

    expect(sentCodes).toHaveLength(1);
    expect(sentCodes[0]).not.toBe("000000");
  });

  it("rate limits repeated sends to the same email", async () => {
    const handlers = createHandlers();

    const first = await sendCode(handlers);
    const second = await sendCode(handlers);

    expect(first.status).toBe(200);
    expect(second.status).toBe(429);
    await expect(second.json()).resolves.toMatchObject({
      ok: false,
      errors: { request: "验证码发送过于频繁，请稍后再试" }
    });
  });

  it("rejects wrong codes and locks after too many attempts", async () => {
    const handlers = createHandlers();
    await sendCode(handlers);

    for (let index = 0; index < 4; index += 1) {
      const response = await login(handlers, "654321");
      expect(response.status).toBe(400);
    }

    const locked = await login(handlers, "654321");

    expect(locked.status).toBe(429);
    await expect(locked.json()).resolves.toMatchObject({
      ok: false,
      errors: { request: "验证码错误次数过多，请重新获取" }
    });
  });

  it("rejects expired codes", async () => {
    const collections = {
      emailCodeCollection: createFakeCollection(),
      userCollection: createFakeCollection()
    };
    const firstHandlers = createEmailAuthApiHandlers({
      ...collections,
      codeGenerator: () => "123456",
      emailDelivery: {
        async send() {
          return { ok: true };
        }
      },
      env: {
        APP_ENV: "test",
        AUTH_SESSION_SECRET: "email-auth-test-secret",
        EMAIL_CODE_SECRET: "email-code-test-secret",
        NODE_ENV: "test"
      },
      now: () => new Date("2026-06-27T10:00:00.000Z")
    });
    const laterHandlers = createEmailAuthApiHandlers({
      ...collections,
      codeGenerator: () => "123456",
      emailDelivery: {
        async send() {
          return { ok: true };
        }
      },
      env: {
        APP_ENV: "test",
        AUTH_SESSION_SECRET: "email-auth-test-secret",
        EMAIL_CODE_SECRET: "email-code-test-secret",
        NODE_ENV: "test"
      },
      now: () => new Date("2026-06-27T10:06:00.000Z")
    });

    await sendCode(firstHandlers);
    const response = await login(laterHandlers);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      errors: { request: "验证码已过期，请重新获取" }
    });
  });

  it("creates a new account on first login, reuses it on later login, and prevents code reuse", async () => {
    const collections = {
      emailCodeCollection: createFakeCollection(),
      userCollection: createFakeCollection()
    };
    const handlers = createEmailAuthApiHandlers({
      ...collections,
      codeGenerator: () => "123456",
      emailDelivery: {
        async send() {
          return { ok: true };
        }
      },
      env: {
        APP_ENV: "test",
        AUTH_SESSION_SECRET: "email-auth-test-secret",
        EMAIL_CODE_SECRET: "email-code-test-secret",
        NODE_ENV: "test"
      },
      now: () => new Date("2026-06-27T10:00:00.000Z")
    });

    await sendCode(handlers);
    const firstLogin = await login(handlers);
    const firstBody = await firstLogin.json();
    const reused = await login(handlers);

    expect(firstLogin.status).toBe(200);
    expect(firstLogin.headers.get("set-cookie")).toContain("ungradu_auth_session=");
    expect(firstBody.value).toMatchObject({
      emailMasked: "s***t@example.com"
    });
    expect(firstBody.value.userId).toMatch(/^email_/);
    expect(reused.status).toBe(400);
    await expect(reused.json()).resolves.toMatchObject({
      ok: false,
      errors: { request: "验证码已使用，请重新获取" }
    });

    const secondHandlers = createEmailAuthApiHandlers({
      ...collections,
      codeGenerator: () => "234567",
      emailDelivery: {
        async send() {
          return { ok: true };
        }
      },
      env: {
        APP_ENV: "test",
        AUTH_SESSION_SECRET: "email-auth-test-secret",
        EMAIL_CODE_SECRET: "email-code-test-secret",
        NODE_ENV: "test"
      },
      now: () => new Date("2026-06-27T10:02:00.000Z")
    });

    await sendCode(secondHandlers);
    const secondLogin = await login(secondHandlers, "234567");
    const secondBody = await secondLogin.json();

    expect(secondLogin.status).toBe(200);
    expect(secondBody.value.userId).toBe(firstBody.value.userId);
    expect(secondBody.value.createdAt).toBe(firstBody.value.createdAt);
  });

  it("does not consume a valid code when session creation is unavailable", async () => {
    const collections = {
      emailCodeCollection: createFakeCollection(),
      userCollection: createFakeCollection()
    };
    const baseOptions = {
      ...collections,
      codeGenerator: () => "123456",
      emailDelivery: {
        async send() {
          return { ok: true as const };
        }
      },
      rateLimiter: createLayeredRateLimiter(),
      now: () => new Date("2026-06-27T10:00:00.000Z")
    };
    const email = "student@example.com";
    const emailHash = hashEmail(email);
    const misconfiguredHandlers = createEmailAuthApiHandlers({
      ...baseOptions,
      rateLimiter: createLayeredRateLimiter({
        mode: "production",
        external: { check: () => ({ ok: true as const }) }
      }),
      env: {
        APP_ENV: "production",
        ALLOWED_ORIGINS: "https://ungraduedu.eu.cc",
        CSRF_SECRET: "email-csrf-test-secret",
        EMAIL_CODE_SECRET: "email-code-test-secret",
        NODE_ENV: "production"
      }
    });

    await sendCode(misconfiguredHandlers, email);
    const failedLogin = await login(misconfiguredHandlers, "123456", email);
    const codeAfterFailure = collections.emailCodeCollection.documents.get(emailHash);

    expect(failedLogin.status).toBe(503);
    await expect(failedLogin.json()).resolves.toMatchObject({
      ok: false,
      errors: { request: "验证码原子消费暂不可用，请稍后再试" }
    });
    expect(codeAfterFailure?.usedAt).toBeUndefined();

    const recoveredHandlers = createEmailAuthApiHandlers({
      ...baseOptions,
      env: {
        APP_ENV: "test",
        AUTH_SESSION_SECRET: "email-auth-test-secret",
        EMAIL_CODE_SECRET: "email-code-test-secret",
        NODE_ENV: "test"
      }
    });
    const recoveredLogin = await login(recoveredHandlers, "123456", email);

    expect(recoveredLogin.status).toBe(200);
    expect(recoveredLogin.headers.get("set-cookie")).toContain("ungradu_auth_session=");
  });

  it("marks the email code used only after a successful login response", async () => {
    const collections = {
      emailCodeCollection: createFakeCollection(),
      userCollection: createFakeCollection()
    };
    const email = "student@example.com";
    const emailHash = hashEmail(email);
    const handlers = createEmailAuthApiHandlers({
      ...collections,
      codeGenerator: () => "123456",
      emailDelivery: {
        async send() {
          return { ok: true };
        }
      },
      env: {
        APP_ENV: "test",
        AUTH_SESSION_SECRET: "email-auth-test-secret",
        EMAIL_CODE_SECRET: "email-code-test-secret",
        NODE_ENV: "test"
      },
      now: () => new Date("2026-06-27T10:00:00.000Z")
    });

    await sendCode(handlers, email);
    expect(collections.emailCodeCollection.documents.get(emailHash)?.usedAt).toBeUndefined();

    const loggedIn = await login(handlers, "123456", email);

    expect(loggedIn.status).toBe(200);
    expect(collections.emailCodeCollection.documents.get(emailHash)?.usedAt).toBe(
      "2026-06-27T10:00:00.000Z"
    );
  });

  it("logs in existing CloudBase email users without writing the document _id", async () => {
    const email = "student@example.com";
    const emailHash = hashEmail(email);
    const collections = {
      emailCodeCollection: createFakeCollection(),
      userCollection: createFakeCollection({
        [emailHash]: {
          _id: emailHash,
          createdAt: "2026-06-26T10:00:00.000Z",
          emailHash,
          emailMasked: "s***t@example.com",
          lastLoginAt: "2026-06-26T10:00:00.000Z",
          status: "active",
          userId: `email_${emailHash.slice(0, 24)}`
        }
      })
    };
    const handlers = createEmailAuthApiHandlers({
      ...collections,
      codeGenerator: () => "123456",
      emailDelivery: {
        async send() {
          return { ok: true };
        }
      },
      env: {
        APP_ENV: "test",
        AUTH_SESSION_SECRET: "email-auth-test-secret",
        EMAIL_CODE_SECRET: "email-code-test-secret",
        NODE_ENV: "test"
      },
      now: () => new Date("2026-06-27T10:00:00.000Z")
    });

    await sendCode(handlers, email);
    const loggedIn = await login(handlers, "123456", email);

    expect(loggedIn.status).toBe(200);
    expect(collections.userCollection.documents.get(emailHash)).not.toHaveProperty("_id");
    expect(collections.userCollection.documents.get(emailHash)?.lastLoginAt).toBe(
      "2026-06-27T10:00:00.000Z"
    );
  });

  it("keeps the signed cookie session across refresh and clears access after logout", async () => {
    const handlers = createHandlers();
    await sendCode(handlers);
    const loggedIn = await login(handlers);
    const cookie = loggedIn.headers.get("set-cookie") ?? "";

    const session = readAuthSessionFromRequest(
      new Request("http://localhost/api/auth/session", { headers: { cookie } }),
      {
        AUTH_SESSION_SECRET: "email-auth-test-secret",
        NODE_ENV: "production"
      }
    );
    const contactProfile = createContactProfileApiHandlers({
      collection: createFakeCollection(),
      env: {
        AUTH_SESSION_SECRET: "email-auth-test-secret",
        NODE_ENV: "production"
      }
    });
    const privateApiAfterLogout = await contactProfile.GET(
      new Request("http://localhost/api/contact-profile")
    );

    expect(session?.emailMasked).toBe("s***t@example.com");
    expect(session?.userId).toMatch(/^email_/);
    expect(privateApiAfterLogout.status).toBe(401);
  });

  it("rejects the old fixed test code on the email login endpoint in production", async () => {
    const handlers = createHandlers();
    await sendCode(handlers);

    const response = await login(handlers, "000000");

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      errors: { code: "请填写邮箱验证码" }
    });
  });

  it("returns a clear production configuration failure when email delivery is missing", async () => {
    const handlers = createEmailAuthApiHandlers({
      codeGenerator: () => "123456",
      emailCodeCollection: createFakeCollection(),
      emailDelivery: {
        async send() {
          return { ok: false, error: "Email provider is not configured." };
        }
      },
      env: {
        APP_ENV: "test",
        AUTH_SESSION_SECRET: "email-auth-test-secret",
        EMAIL_CODE_SECRET: "email-code-test-secret",
        NODE_ENV: "test"
      },
      userCollection: createFakeCollection()
    });

    const response = await sendCode(handlers);

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      errors: { request: "邮箱验证码发送失败，请稍后再试" }
    });
  });

  it("sets a password for the signed-in email account without storing plaintext", async () => {
    const collections = {
      emailCodeCollection: createFakeCollection(),
      userCollection: createFakeCollection()
    };
    const handlers = createEmailAuthApiHandlers({
      ...collections,
      codeGenerator: () => "123456",
      emailDelivery: {
        async send() {
          return { ok: true };
        }
      },
      env: {
        APP_ENV: "test",
        AUTH_SESSION_SECRET: "email-auth-test-secret",
        EMAIL_CODE_SECRET: "email-code-test-secret",
        NODE_ENV: "test"
      },
      now: () => new Date("2026-06-27T10:00:00.000Z")
    });
    await sendCode(handlers);
    const loggedIn = await login(handlers);
    const cookie = loggedIn.headers.get("set-cookie") ?? "";

    const response = await setPassword(handlers, cookie);
    const user = collections.userCollection.documents.get(hashEmail("student@example.com"));

    expect(response.status).toBe(200);
    expect(user?.passwordHash).toEqual(expect.any(String));
    expect(user?.passwordHash).not.toBe("Tutor12345");
    expect(String(user?.passwordHash)).toMatch(/^scrypt\$/);
  });

  it("sets a password for existing CloudBase email users without writing the document _id", async () => {
    const email = "student@example.com";
    const emailHash = hashEmail(email);
    const collections = {
      emailCodeCollection: createFakeCollection(),
      userCollection: createFakeCollection({
        [emailHash]: {
          _id: emailHash,
          createdAt: "2026-06-26T10:00:00.000Z",
          emailHash,
          emailMasked: "s***t@example.com",
          lastLoginAt: "2026-06-27T10:00:00.000Z",
          status: "active",
          userId: `email_${emailHash.slice(0, 24)}`
        }
      })
    };
    const handlers = createEmailAuthApiHandlers({
      ...collections,
      emailDelivery: {
        async send() {
          return { ok: true };
        }
      },
      env: {
        APP_ENV: "test",
        AUTH_SESSION_SECRET: "email-auth-test-secret",
        EMAIL_CODE_SECRET: "email-code-test-secret",
        NODE_ENV: "test"
      },
      now: () => new Date("2026-06-27T10:00:00.000Z")
    });
    const realCookie =
      createAuthSessionCookie({
        emailMasked: "s***t@example.com",
        env: {
          AUTH_SESSION_SECRET: "email-auth-test-secret",
          NODE_ENV: "production"
        },
        userId: `email_${emailHash.slice(0, 24)}`
      }) ?? "";

    const response = await setPassword(handlers, realCookie);

    expect(response.status).toBe(200);
    expect(collections.userCollection.documents.get(emailHash)).not.toHaveProperty("_id");
  });

  it("rejects weak or mismatched passwords before saving them", async () => {
    const collections = {
      emailCodeCollection: createFakeCollection(),
      userCollection: createFakeCollection()
    };
    const handlers = createEmailAuthApiHandlers({
      ...collections,
      codeGenerator: () => "123456",
      emailDelivery: {
        async send() {
          return { ok: true };
        }
      },
      env: {
        APP_ENV: "test",
        AUTH_SESSION_SECRET: "email-auth-test-secret",
        EMAIL_CODE_SECRET: "email-code-test-secret",
        NODE_ENV: "test"
      }
    });
    await sendCode(handlers);
    const loggedIn = await login(handlers);
    const cookie = loggedIn.headers.get("set-cookie") ?? "";

    const weak = await setPassword(handlers, cookie, "password", "password");
    const mismatched = await setPassword(handlers, cookie, "Tutor12345", "Tutor54321");

    expect(weak.status).toBe(400);
    await expect(weak.json()).resolves.toMatchObject({
      ok: false,
      errors: { password: "密码至少 8 位，并同时包含字母和数字" }
    });
    expect(mismatched.status).toBe(400);
    await expect(mismatched.json()).resolves.toMatchObject({
      ok: false,
      errors: { passwordConfirm: "两次输入的密码不一致" }
    });
  });

  it("logs in with email and password after password setup", async () => {
    const handlers = createHandlers();
    await sendCode(handlers);
    const loggedIn = await login(handlers);
    await setPassword(handlers, loggedIn.headers.get("set-cookie") ?? "");

    const response = await passwordLogin(handlers);

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("ungradu_auth_session=");
  });

  it("logs in with password for existing CloudBase users without writing the document _id", async () => {
    const email = "student@example.com";
    const emailHash = hashEmail(email);
    const collections = {
      emailCodeCollection: createFakeCollection(),
      userCollection: createFakeCollection()
    };
    const setupHandlers = createEmailAuthApiHandlers({
      ...collections,
      codeGenerator: () => "123456",
      emailDelivery: {
        async send() {
          return { ok: true };
        }
      },
      env: {
        APP_ENV: "test",
        AUTH_SESSION_SECRET: "email-auth-test-secret",
        EMAIL_CODE_SECRET: "email-code-test-secret",
        NODE_ENV: "test"
      },
      now: () => new Date("2026-06-27T10:00:00.000Z")
    });
    await sendCode(setupHandlers, email);
    const loggedIn = await login(setupHandlers, "123456", email);
    await setPassword(setupHandlers, loggedIn.headers.get("set-cookie") ?? "", "Tutor12345");
    const storedUser = collections.userCollection.documents.get(emailHash);
    collections.userCollection.documents.set(emailHash, {
      ...storedUser,
      _id: emailHash
    });
    const loginHandlers = createEmailAuthApiHandlers({
      ...collections,
      emailDelivery: {
        async send() {
          return { ok: true };
        }
      },
      env: {
        APP_ENV: "test",
        AUTH_SESSION_SECRET: "email-auth-test-secret",
        EMAIL_CODE_SECRET: "email-code-test-secret",
        NODE_ENV: "test"
      },
      now: () => new Date("2026-06-27T10:05:00.000Z")
    });

    const response = await passwordLogin(loginHandlers, "Tutor12345", email);

    expect(response.status).toBe(200);
    expect(collections.userCollection.documents.get(emailHash)).not.toHaveProperty("_id");
    expect(collections.userCollection.documents.get(emailHash)?.lastLoginAt).toBe(
      "2026-06-27T10:05:00.000Z"
    );
  });

  it("rejects wrong password with a generic message", async () => {
    const handlers = createHandlers();
    await sendCode(handlers);
    const loggedIn = await login(handlers);
    await setPassword(handlers, loggedIn.headers.get("set-cookie") ?? "");

    const response = await passwordLogin(handlers, "Wrong12345");

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      errors: { request: "邮箱或密码不正确" }
    });
  });

  it("resets an existing password with a valid email code", async () => {
    const collections = {
      emailCodeCollection: createFakeCollection(),
      userCollection: createFakeCollection()
    };
    const baseOptions = {
      ...collections,
      codeGenerator: () => "123456",
      emailDelivery: {
        async send() {
          return { ok: true as const };
        }
      },
      env: {
        APP_ENV: "test",
        AUTH_SESSION_SECRET: "email-auth-test-secret",
        EMAIL_CODE_SECRET: "email-code-test-secret",
        NODE_ENV: "test"
      }
    };
    const handlers = createEmailAuthApiHandlers({
      ...baseOptions,
      now: () => new Date("2026-06-27T10:00:00.000Z")
    });
    await sendCode(handlers);
    const loggedIn = await login(handlers);
    await setPassword(handlers, loggedIn.headers.get("set-cookie") ?? "", "Tutor12345");
    const resetHandlers = createEmailAuthApiHandlers({
      ...baseOptions,
      now: () => new Date("2026-06-27T10:02:00.000Z")
    });
    await sendCode(resetHandlers);

    const reset = await resetPassword(resetHandlers, "123456", "Tutor67890");
    const oldPassword = await passwordLogin(resetHandlers, "Tutor12345");
    const newPassword = await passwordLogin(resetHandlers, "Tutor67890");

    expect(reset.status).toBe(200);
    expect(oldPassword.status).toBe(400);
    expect(newPassword.status).toBe(200);
  });
});
