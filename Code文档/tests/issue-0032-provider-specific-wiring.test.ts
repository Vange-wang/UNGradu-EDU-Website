import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  documents: new Map<string, Record<string, unknown>>(),
  writes: [] as Array<{ collection: string; id: string }>
}));

const database = vi.hoisted(() => ({
  collection(name: string) {
    return {
      doc(id: string) {
        return {
          async get() {
            const value = state.documents.get(`${name}:${id}`);
            return { data: value ? { ...value } : undefined };
          },
          async set(value: Record<string, unknown>) {
            state.documents.set(`${name}:${id}`, { ...value });
            state.writes.push({ collection: name, id });
            return { updated: 1 };
          },
          async update(value: Record<string, unknown>) {
            state.documents.set(`${name}:${id}`, { ...value });
            state.writes.push({ collection: name, id });
            return { updated: 1 };
          }
        };
      }
    };
  },
  async runTransaction<T>(operation: (transaction: {
    collection: typeof database.collection;
  }) => Promise<T>) {
    return operation({ collection: database.collection.bind(database) });
  }
}));

vi.mock("@/server/cloudbase-server", () => ({
  createCloudBaseServerApp: () => ({ database: () => database })
}));

const originalEnv = { ...process.env };
const origin = "https://synthetic-origin.example.test";

function configureProductionRoute() {
  process.env.APP_ENV = "production";
  Object.assign(process.env, { NODE_ENV: "production" });
  process.env.ALLOWED_ORIGINS = origin;
  process.env.ORIGIN_VERIFY_MODE = "enforce";
  process.env.ORIGIN_VERIFY_SECRET = "synthetic-origin-proof";
  process.env.CSRF_SECRET = "synthetic-csrf-secret";
  process.env.AUTH_CHALLENGE_REPLAY_COLLECTION = "auth_challenge_replays";
  process.env.AUTH_CHALLENGE_REPLAY_KEY_SECRET = "synthetic-replay-key";
  process.env.AUTH_RATE_LIMIT_COLLECTION = "auth_rate_limits";
  process.env.AUTH_RATE_LIMIT_KEY_SECRET = "synthetic-rate-limit-key";
  delete process.env.EMAIL_CODE_SECRET;
}

function createRequest() {
  return new Request(`${origin}/api/auth/email/send-code`, {
    body: JSON.stringify({
      challengeToken: "synthetic-provider-token",
      email: "synthetic@example.test"
    }),
    headers: {
      "content-type": "application/json",
      origin
    },
    method: "POST"
  });
}

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-08-20T08:01:00.000Z"));
  state.documents.clear();
  state.writes.length = 0;
  configureProductionRoute();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
});

describe("ISSUE-0032 provider-specific send-code route wiring", () => {
  it("uses the configured Turnstile verifier with a normalized exact hostname allowlist", async () => {
    process.env.TURNSTILE_SECRET_KEY = "synthetic-turnstile-secret";
    process.env.TURNSTILE_EXPECTED_HOSTNAMES =
      " , SyNtHeTiC-HoSt.ExAmPlE.TeSt,  ";
    const siteverify = vi.spyOn(globalThis, "fetch").mockImplementation(
      async (input, init) => {
        expect(String(input)).toBe(
          "https://challenges.cloudflare.com/turnstile/v0/siteverify"
        );
        expect(init?.method).toBe("POST");
        const body = init?.body;
        expect(body).toBeInstanceOf(FormData);
        expect((body as FormData).get("secret")).toBe(
          "synthetic-turnstile-secret"
        );
        expect((body as FormData).get("response")).toBe(
          "synthetic-provider-token"
        );
        return Response.json({
          action: "email_send_code",
          challenge_ts: "2026-08-20T08:00:00.000Z",
          hostname: "synthetic-host.example.test",
          success: true
        });
      }
    );
    const { POST } = await import("@/app/api/auth/email/send-code/route");

    const response = await POST(createRequest());

    expect(siteverify).toHaveBeenCalledOnce();
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      errors: { request: "邮箱验证码密钥未配置" },
      ok: false,
      value: null
    });
    expect(
      state.writes.some(({ collection }) => collection === "email_login_codes")
    ).toBe(false);
  });

  it.each([
    ["missing secret", undefined, "synthetic-host.example.test"],
    ["empty hostname allowlist", "synthetic-turnstile-secret", " ,  , "]
  ])("fails closed before the provider when %s", async (_, secret, hostnames) => {
    if (secret) process.env.TURNSTILE_SECRET_KEY = secret;
    else delete process.env.TURNSTILE_SECRET_KEY;
    process.env.TURNSTILE_EXPECTED_HOSTNAMES = hostnames;
    const siteverify = vi.spyOn(globalThis, "fetch");
    const { POST } = await import("@/app/api/auth/email/send-code/route");

    const response = await POST(createRequest());

    expect(response.status).toBe(503);
    expect(siteverify).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      errors: { request: "人机验证未通过，请稍后重试" },
      ok: false,
      value: null
    });
    expect(
      state.writes.some(({ collection }) => collection === "email_login_codes")
    ).toBe(false);
  });
});
