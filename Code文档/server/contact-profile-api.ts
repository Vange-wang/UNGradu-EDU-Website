import { isTestLoginAllowed } from "@/features/auth/test-auth";
import type { ContactProfileInput } from "@/features/profile/contact-profile";
import {
  readServerContactProfile,
  saveServerContactProfile
} from "@/server/contact-profiles";

type ContactProfileCollection = Parameters<typeof readServerContactProfile>[0]["collection"];

type RuntimeEnv = {
  NODE_ENV?: string;
  NEXT_PUBLIC_ALLOW_TEST_LOGIN?: string;
};

type ContactProfileApiDependencies = {
  collection: ContactProfileCollection;
  env?: RuntimeEnv;
};

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, { status });
}

function readTemporaryAuthenticatedUserId(request: Request, env: RuntimeEnv) {
  const testUserPhone = request.headers.get("x-ungradu-test-user-phone")?.trim();

  if (!testUserPhone) {
    return {
      ok: false as const,
      response: jsonResponse(
        {
          ok: false,
          value: null,
          errors: { request: "必须登录后才能访问联系方式存档" }
        },
        401
      )
    };
  }

  if (
    !isTestLoginAllowed({
      allowTestLogin: env.NEXT_PUBLIC_ALLOW_TEST_LOGIN,
      nodeEnv: env.NODE_ENV
    })
  ) {
    return {
      ok: false as const,
      response: jsonResponse(
        {
          ok: false,
          value: null,
          errors: { request: "生产环境不接受临时测试登录身份" }
        },
        401
      )
    };
  }

  return {
    ok: true as const,
    authenticatedUserId: testUserPhone
  };
}

export function createContactProfileApiHandlers({
  collection,
  env = process.env
}: ContactProfileApiDependencies) {
  return {
    async GET(request: Request) {
      const auth = readTemporaryAuthenticatedUserId(request, env);

      if (!auth.ok) {
        return auth.response;
      }

      const result = await readServerContactProfile({
        authenticatedUserId: auth.authenticatedUserId,
        collection
      });

      return jsonResponse(result, result.ok ? 200 : 401);
    },

    async PUT(request: Request) {
      const auth = readTemporaryAuthenticatedUserId(request, env);

      if (!auth.ok) {
        return auth.response;
      }

      const input = await request.json() as ContactProfileInput;
      const result = await saveServerContactProfile({
        authenticatedUserId: auth.authenticatedUserId,
        collection,
        input
      });

      if (!result.ok) {
        return jsonResponse(result, result.errors.request ? 401 : 400);
      }

      return jsonResponse(result);
    }
  };
}
