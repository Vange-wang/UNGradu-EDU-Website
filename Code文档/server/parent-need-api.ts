import type { ParentNeedInput } from "@/features/parent-needs/parent-need";
import {
  jsonResponse,
  guardWriteRequest,
  readJsonBody,
  readAuthenticatedUserIdWithRevocation,
  statusForResult,
  createSecurityRuntimeEnv,
  type RuntimeEnv
} from "@/server/api-utils";
import {
  findPublicServerParentNeedById,
  listPublicServerParentNeeds,
  listServerParentNeedsForOwner,
  saveServerParentNeed,
  updateServerParentNeed
} from "@/server/parent-needs";

type ParentNeedCollection = Parameters<typeof saveServerParentNeed>[0]["collection"];

type RouteContext = {
  params: Promise<{ id: string }>;
};

export function createParentNeedApiHandlers({
  collection,
  env = process.env,
  sessionRevocationGuard
}: {
  collection: ParentNeedCollection;
  env?: RuntimeEnv;
  sessionRevocationGuard?: RuntimeEnv["sessionRevocationGuard"];
}) {
  const securedEnv: RuntimeEnv = createSecurityRuntimeEnv({
    ...env,
    sessionRevocationGuard: sessionRevocationGuard ?? env.sessionRevocationGuard
  });
  return {
    async GET_COLLECTION(request: Request) {
      const url = new URL(request.url);

      if (url.searchParams.get("scope") === "mine") {
        const auth = await readAuthenticatedUserIdWithRevocation(request, securedEnv);

        if (!auth.ok) {
          return auth.response;
        }

        const result = await listServerParentNeedsForOwner({
          authenticatedUserId: auth.authenticatedUserId,
          collection
        });

        return jsonResponse(result, statusForResult(result, 400));
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
      const auth = await readAuthenticatedUserIdWithRevocation(request, securedEnv);

      if (!auth.ok) {
        return auth.response;
      }

      const securityResponse = guardWriteRequest(request, securedEnv, auth.authenticatedUserId);
      if (securityResponse) return securityResponse;

      const body = await readJsonBody<ParentNeedInput>(request, {
        allowedKeys: ["teacherGenderPreference", "subjects", "grade", "budgetMin", "budgetMax", "timeSlots", "region", "community", "childIntro"],
        schema: {
          teacherGenderPreference: { type: "string" },
          subjects: { type: "array", items: { type: "string" } },
          grade: { type: "string" },
          budgetMin: { type: "string" },
          budgetMax: { type: "string" },
          timeSlots: { type: "array", items: { type: "string" } },
          region: { object: { allowedKeys: ["province", "city", "district"], fields: { province: { type: "string" }, city: { type: "string" }, district: { type: "string" } } } },
          community: { type: "string" },
          childIntro: { type: "string" }
        }
      });

      if (!body.ok) {
        return body.response;
      }

      const result = await saveServerParentNeed({
        authenticatedUserId: auth.authenticatedUserId,
        collection,
        input: body.value
      });

      return jsonResponse(result, statusForResult(result, 400));
    },

    async GET_ITEM(_request: Request, context: RouteContext) {
      const { id } = await context.params;
      const result = await findPublicServerParentNeedById({ collection, id });

      return jsonResponse(result);
    },

    async PATCH_ITEM(request: Request, context: RouteContext) {
      const auth = await readAuthenticatedUserIdWithRevocation(request, securedEnv);

      if (!auth.ok) {
        return auth.response;
      }

      const securityResponse = guardWriteRequest(request, securedEnv, auth.authenticatedUserId);
      if (securityResponse) return securityResponse;

      const body = await readJsonBody<ParentNeedInput>(request, {
        allowedKeys: ["teacherGenderPreference", "subjects", "grade", "budgetMin", "budgetMax", "timeSlots", "region", "community", "childIntro"],
        schema: {
          teacherGenderPreference: { type: "string" },
          subjects: { type: "array", items: { type: "string" } },
          grade: { type: "string" },
          budgetMin: { type: "string" },
          budgetMax: { type: "string" },
          timeSlots: { type: "array", items: { type: "string" } },
          region: { object: { allowedKeys: ["province", "city", "district"], fields: { province: { type: "string" }, city: { type: "string" }, district: { type: "string" } } } },
          community: { type: "string" },
          childIntro: { type: "string" }
        }
      });

      if (!body.ok) {
        return body.response;
      }

      const { id } = await context.params;
      const result = await updateServerParentNeed({
        authenticatedUserId: auth.authenticatedUserId,
        collection,
        id,
        input: body.value
      });

      return jsonResponse(result, statusForResult(result, 403));
    }
  };
}
