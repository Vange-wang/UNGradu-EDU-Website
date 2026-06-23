import { describe, expect, it } from "vitest";

import { createAuthApiHandlers } from "@/server/auth-api";
import { createContactProfileApiHandlers } from "@/server/contact-profile-api";

type StoredDocument = Record<string, unknown>;

function createFakeCollection(initialValues: Record<string, StoredDocument> = {}) {
  const documents = new Map(Object.entries(initialValues));

  return {
    doc(docId: string) {
      return {
        async get() {
          const data = documents.get(docId);
          return { data: data ? [{ ...data, id: docId }] : [] };
        },
        async set(data: StoredDocument) {
          documents.set(docId, data);
          return { updated: 1 };
        }
      };
    }
  };
}

describe("backend trusted auth session API", () => {
  it("creates an HttpOnly signed session cookie and reads it back", async () => {
    const handlers = createAuthApiHandlers({
      env: {
        AUTH_SESSION_SECRET: "m5-test-secret",
        NODE_ENV: "test",
        NEXT_PUBLIC_ALLOW_TEST_LOGIN: "true"
      }
    });

    const login = await handlers.POST_TEST_LOGIN(
      new Request("http://localhost/api/auth/test-login", {
        body: JSON.stringify({ phone: "13800138000", code: "000000" }),
        method: "POST"
      })
    );
    const cookie = login.headers.get("set-cookie") ?? "";
    const session = await handlers.GET_SESSION(
      new Request("http://localhost/api/auth/session", {
        headers: { cookie }
      })
    );

    expect(login.status).toBe(200);
    expect(cookie).toContain("ungradu_auth_session=");
    expect(cookie.toLowerCase()).toContain("httponly");
    await expect(session.json()).resolves.toMatchObject({
      ok: true,
      value: { phone: "13800138000" }
    });
  });

  it("lets business APIs read identity from signed backend cookie without browser identity headers", async () => {
    const env = {
      AUTH_SESSION_SECRET: "m5-test-secret",
      NODE_ENV: "test",
      NEXT_PUBLIC_ALLOW_TEST_LOGIN: "true"
    };
    const auth = createAuthApiHandlers({ env });
    const login = await auth.POST_TEST_LOGIN(
      new Request("http://localhost/api/auth/test-login", {
        body: JSON.stringify({ phone: "13800138000", code: "000000" }),
        method: "POST"
      })
    );
    const cookie = login.headers.get("set-cookie") ?? "";
    const contactProfile = createContactProfileApiHandlers({
      collection: createFakeCollection(),
      env
    });

    const saved = await contactProfile.PUT(
      new Request("http://localhost/api/contact-profile", {
        body: JSON.stringify({ phone: "13800138000", wechat: "parent_a" }),
        headers: { cookie },
        method: "PUT"
      })
    );

    expect(saved.status).toBe(200);
    await expect(saved.json()).resolves.toMatchObject({
      ok: true,
      value: { phone: "13800138000", wechat: "parent_a" }
    });
  });

  it("rejects temporary test login creation in production", async () => {
    const handlers = createAuthApiHandlers({
      env: {
        APP_ENV: "production",
        AUTH_SESSION_SECRET: "m5-test-secret",
        M5_ENABLE_HOSTED_TEST_LOGIN: "true",
        NODE_ENV: "production",
        NEXT_PUBLIC_ALLOW_TEST_LOGIN: "true"
      }
    });

    const response = await handlers.POST_TEST_LOGIN(
      new Request("http://localhost/api/auth/test-login", {
        body: JSON.stringify({ phone: "13800138000", code: "000000" }),
        method: "POST"
      })
    );

    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("allows temporary test login in isolated hosted M5 test environment", async () => {
    const handlers = createAuthApiHandlers({
      env: {
        APP_ENV: "test",
        AUTH_SESSION_SECRET: "m5-test-secret",
        M5_ENABLE_HOSTED_TEST_LOGIN: "true",
        NODE_ENV: "production",
        NEXT_PUBLIC_ALLOW_TEST_LOGIN: "false"
      }
    });

    const response = await handlers.POST_TEST_LOGIN(
      new Request("http://localhost/api/auth/test-login", {
        body: JSON.stringify({ phone: "13800138000", code: "000000" }),
        method: "POST"
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("ungradu_auth_session=");
  });
});
