import { describe, expect, it } from "vitest";

import { createSmsAuthApiHandlers } from "@/server/sms-auth-api";
import { readAuthSessionFromRequest } from "@/server/auth-session";
import { createContactProfileApiHandlers } from "@/server/contact-profile-api";

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

  return createSmsAuthApiHandlers({
    codeGenerator: () => options.code ?? "123456",
    env: {
      APP_ENV: "production",
      AUTH_SESSION_SECRET: "sms-auth-test-secret",
      NODE_ENV: "production"
    },
    now: () => options.now ?? new Date("2026-06-27T10:00:00.000Z"),
    smsCodeCollection: createFakeCollection(),
    smsDelivery: {
      async send({ code }) {
        sentCodes.push(code);
        return { ok: true };
      }
    },
    userCollection: createFakeCollection()
  });
}

async function sendCode(
  handlers: ReturnType<typeof createSmsAuthApiHandlers>,
  phone = "13800138000"
) {
  return handlers.POST_SEND_CODE(
    new Request("http://localhost/api/auth/sms/send-code", {
      body: JSON.stringify({ phone }),
      headers: { "content-type": "application/json" },
      method: "POST"
    })
  );
}

async function login(
  handlers: ReturnType<typeof createSmsAuthApiHandlers>,
  code = "123456",
  phone = "13800138000"
) {
  return handlers.POST_LOGIN(
    new Request("http://localhost/api/auth/sms/login", {
      body: JSON.stringify({ code, phone }),
      headers: { "content-type": "application/json" },
      method: "POST"
    })
  );
}

describe("SMS auth API handlers", () => {
  it("rejects invalid phone numbers before sending a login code", async () => {
    const handlers = createHandlers();
    const response = await sendCode(handlers, "123");

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      errors: { phone: "请填写有效的 11 位手机号" }
    });
  });

  it("sends a one-time code without returning the code to the client", async () => {
    const sentCodes: string[] = [];
    const handlers = createHandlers({ sentCodes });

    const response = await sendCode(handlers);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(sentCodes).toEqual(["123456"]);
    expect(JSON.stringify(body)).not.toContain("123456");
    expect(JSON.stringify(body)).not.toContain("13800138000");
    expect(body).toMatchObject({
      ok: true,
      value: { phoneMasked: "138****8000" }
    });
  });

  it("does not issue the old fixed test code even if the generator returns it", async () => {
    const sentCodes: string[] = [];
    const handlers = createHandlers({ code: "000000", sentCodes });

    await sendCode(handlers);

    expect(sentCodes).toHaveLength(1);
    expect(sentCodes[0]).not.toBe("000000");
  });

  it("rate limits repeated sends to the same phone", async () => {
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
      smsCodeCollection: createFakeCollection(),
      userCollection: createFakeCollection()
    };
    const sentCodes: string[] = [];
    const firstHandlers = createSmsAuthApiHandlers({
      ...collections,
      codeGenerator: () => "123456",
      env: {
        APP_ENV: "production",
        AUTH_SESSION_SECRET: "sms-auth-test-secret",
        NODE_ENV: "production"
      },
      now: () => new Date("2026-06-27T10:00:00.000Z"),
      smsDelivery: {
        async send({ code }) {
          sentCodes.push(code);
          return { ok: true };
        }
      }
    });
    const laterHandlers = createSmsAuthApiHandlers({
      ...collections,
      codeGenerator: () => "123456",
      env: {
        APP_ENV: "production",
        AUTH_SESSION_SECRET: "sms-auth-test-secret",
        NODE_ENV: "production"
      },
      now: () => new Date("2026-06-27T10:06:00.000Z"),
      smsDelivery: {
        async send() {
          return { ok: true };
        }
      }
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
      smsCodeCollection: createFakeCollection(),
      userCollection: createFakeCollection()
    };
    const handlers = createSmsAuthApiHandlers({
      ...collections,
      codeGenerator: () => "123456",
      env: {
        APP_ENV: "production",
        AUTH_SESSION_SECRET: "sms-auth-test-secret",
        NODE_ENV: "production"
      },
      now: () => new Date("2026-06-27T10:00:00.000Z"),
      smsDelivery: {
        async send() {
          return { ok: true };
        }
      }
    });

    await sendCode(handlers);
    const firstLogin = await login(handlers);
    const firstBody = await firstLogin.json();
    const reused = await login(handlers);

    expect(firstLogin.status).toBe(200);
    expect(firstLogin.headers.get("set-cookie")).toContain("ungradu_auth_session=");
    expect(firstBody.value).toMatchObject({
      phoneMasked: "138****8000"
    });
    expect(firstBody.value.userId).toMatch(/^user_/);
    expect(reused.status).toBe(400);
    await expect(reused.json()).resolves.toMatchObject({
      ok: false,
      errors: { request: "验证码已使用，请重新获取" }
    });

    const secondHandlers = createSmsAuthApiHandlers({
      ...collections,
      codeGenerator: () => "234567",
      env: {
        APP_ENV: "production",
        AUTH_SESSION_SECRET: "sms-auth-test-secret",
        NODE_ENV: "production"
      },
      now: () => new Date("2026-06-27T10:02:00.000Z"),
      smsDelivery: {
        async send() {
          return { ok: true };
        }
      }
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
        AUTH_SESSION_SECRET: "sms-auth-test-secret",
        NODE_ENV: "production"
      }
    );
    const contactProfile = createContactProfileApiHandlers({
      collection: createFakeCollection(),
      env: {
        AUTH_SESSION_SECRET: "sms-auth-test-secret",
        NODE_ENV: "production"
      }
    });
    const privateApiAfterLogout = await contactProfile.GET(
      new Request("http://localhost/api/contact-profile")
    );

    expect(session?.phone).toBe("13800138000");
    expect(privateApiAfterLogout.status).toBe(401);
  });

  it("rejects the old fixed test code on the SMS login endpoint in production", async () => {
    const handlers = createHandlers();
    await sendCode(handlers);

    const response = await login(handlers, "000000");

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      errors: { code: "请填写短信验证码" }
    });
  });
});
