import { describe, expect, it } from "vitest";

import { readAuthSessionFromRequest } from "@/server/auth-session";
import { createContactProfileApiHandlers } from "@/server/contact-profile-api";
import { createEmailAuthApiHandlers } from "@/server/email-auth-api";

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
          documents.set(docId, data);
          return { updated: 1 };
        },
        async update(data: StoredDocument) {
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
      APP_ENV: "production",
      AUTH_SESSION_SECRET: "email-auth-test-secret",
      EMAIL_CODE_SECRET: "email-code-test-secret",
      NODE_ENV: "production"
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
      headers: { "content-type": "application/json" },
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
        APP_ENV: "production",
        AUTH_SESSION_SECRET: "email-auth-test-secret",
        EMAIL_CODE_SECRET: "email-code-test-secret",
        NODE_ENV: "production"
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
        APP_ENV: "production",
        AUTH_SESSION_SECRET: "email-auth-test-secret",
        EMAIL_CODE_SECRET: "email-code-test-secret",
        NODE_ENV: "production"
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
        APP_ENV: "production",
        AUTH_SESSION_SECRET: "email-auth-test-secret",
        EMAIL_CODE_SECRET: "email-code-test-secret",
        NODE_ENV: "production"
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
        APP_ENV: "production",
        AUTH_SESSION_SECRET: "email-auth-test-secret",
        EMAIL_CODE_SECRET: "email-code-test-secret",
        NODE_ENV: "production"
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
        APP_ENV: "production",
        AUTH_SESSION_SECRET: "email-auth-test-secret",
        EMAIL_CODE_SECRET: "email-code-test-secret",
        NODE_ENV: "production"
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
});
