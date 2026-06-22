import { isTestLoginAllowed } from "@/features/auth/test-auth";
import type { ParentNeedInput } from "@/features/parent-needs/parent-need";
import {
  findPublicServerParentNeedById,
  listPublicServerParentNeeds,
  listServerParentNeedsForOwner,
  saveServerParentNeed
} from "@/server/parent-needs";

type ParentNeedCollection = Parameters<typeof saveServerParentNeed>[0]["collection"];

type RuntimeEnv = {
  NODE_ENV?: string;
  NEXT_PUBLIC_ALLOW_TEST_LOGIN?: string;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, { status });
}

function authFailure(message: string) {
  return jsonResponse(
    {
      ok: false,
      value: null,
      errors: { request: message }
    },
    401
  );
}

function readTemporaryAuthenticatedUserId(request: Request, env: RuntimeEnv) {
  const testUserPhone = request.headers.get("x-ungradu-test-user-phone")?.trim();

  if (!testUserPhone) {
    return {
      ok: false as const,
      response: authFailure("必须登录后才能访问家长需求")
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
      response: authFailure("生产环境不接受临时测试登录身份")
    };
  }

  return {
    ok: true as const,
    authenticatedUserId: testUserPhone
  };
}

function statusForResult(result: { ok: boolean; errors?: { request?: string } }) {
  if (result.ok) {
    return 200;
  }

  return result.errors?.request?.includes("登录") ? 401 : 400;
}

export function createParentNeedApiHandlers({
  collection,
  env = process.env
}: {
  collection: ParentNeedCollection;
  env?: RuntimeEnv;
}) {
  return {
    async GET_COLLECTION(request: Request) {
      const url = new URL(request.url);

      if (url.searchParams.get("scope") === "mine") {
        const auth = readTemporaryAuthenticatedUserId(request, env);

        if (!auth.ok) {
          return auth.response;
        }

        const result = await listServerParentNeedsForOwner({
          authenticatedUserId: auth.authenticatedUserId,
          collection
        });

        return jsonResponse(result, statusForResult(result));
      }

      const result = await listPublicServerParentNeeds({
        collection,
        filters: {
          budgetMax: url.searchParams.get("budgetMax") ?? undefined,
          budgetMin: url.searchParams.get("budgetMin") ?? undefined,
          grade: url.searchParams.get("grade") ?? undefined,
          subject: url.searchParams.get("subject") ?? undefined,
          teacherGenderPreference:
            url.searchParams.get("teacherGenderPreference") ?? undefined
        }
      });

      return jsonResponse(result);
    },

    async POST_COLLECTION(request: Request) {
      const auth = readTemporaryAuthenticatedUserId(request, env);

      if (!auth.ok) {
        return auth.response;
      }

      const input = await request.json() as ParentNeedInput;
      const result = await saveServerParentNeed({
        authenticatedUserId: auth.authenticatedUserId,
        collection,
        input
      });

      return jsonResponse(result, statusForResult(result));
    },

    async GET_ITEM(_request: Request, context: RouteContext) {
      const { id } = await context.params;
      const result = await findPublicServerParentNeedById({ collection, id });

      return jsonResponse(result);
    }
  };
}
