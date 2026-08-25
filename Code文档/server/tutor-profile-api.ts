import type { TutorProfileInput } from "@/features/tutor-profiles/tutor-profile";
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
  findPublicServerTutorProfileById,
  filterServerTutorProfiles,
  listPublicServerTutorProfiles,
  listServerTutorProfilesForOwner,
  saveServerTutorProfile,
  updateServerTutorProfile
} from "@/server/tutor-profiles";
import type { PublicServerTutorProfile } from "@/server/tutor-profiles";
import type { ContactReviewRuntimeGate } from "@/server/security/contact-review-cloudbase";
import type { ContactReviewManagementIntegration } from "@/server/security/contact-review-integration";

type TutorProfileCollection = Parameters<typeof saveServerTutorProfile>[0]["collection"];

type RouteContext = {
  params: Promise<{ id: string }>;
};

export function createTutorProfileApiHandlers({
  collection,
  contactReview,
  contactReviewGate = { enabled: false, ok: true },
  env = process.env,
  sessionRevocationGuard
}: {
  collection: TutorProfileCollection;
  contactReview?: ContactReviewManagementIntegration;
  contactReviewGate?: ContactReviewRuntimeGate;
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

        if (!contactReviewGate.ok) return jsonResponse(contactReviewGate, 503);
        if (contactReviewGate.enabled && contactReview) {
          const result = await contactReview.listOwner(auth.authenticatedUserId);
          return jsonResponse(result, result.ok ? 200 : result.status);
        }

        const result = await listServerTutorProfilesForOwner({
          authenticatedUserId: auth.authenticatedUserId,
          collection
        });

        return jsonResponse(result, statusForResult(result, 400));
      }

      const filters = {
        feeMax: url.searchParams.get("feeMax") ?? undefined,
        feeMin: url.searchParams.get("feeMin") ?? undefined,
        gender: url.searchParams.get("gender") ?? undefined,
        grade: url.searchParams.get("grade") ?? undefined,
        subject: url.searchParams.get("subject") ?? undefined
      };

      if (!contactReviewGate.ok) return jsonResponse(contactReviewGate, 503);
      if (contactReviewGate.enabled) {
        if (!contactReview) return jsonResponse(contactReviewGate, 503);
        const authority = await contactReview.listPublic();
        if (!authority.ok) return jsonResponse(authority, authority.status);
        return jsonResponse({
          ...authority,
          value: filterServerTutorProfiles(authority.value as PublicServerTutorProfile[], filters)
        });
      }

      const result = await listPublicServerTutorProfiles({ collection, filters });
      return jsonResponse(result);
    },

    async POST_COLLECTION(request: Request) {
      const auth = await readAuthenticatedUserIdWithRevocation(request, securedEnv);

      if (!auth.ok) {
        return auth.response;
      }

      const securityResponse = guardWriteRequest(request, securedEnv, auth.authenticatedUserId);
      if (securityResponse) return securityResponse;

      const body = await readJsonBody<TutorProfileInput>(request, {
        allowedKeys: ["gender", "school", "major", "subjects", "grades", "timeSlots", "feeRanges", "abilityDescription", "proofImages"],
        schema: {
          gender: { type: "string" }, school: { type: "string" }, major: { type: "string" },
          subjects: { type: "array", items: { type: "string" } },
          grades: { type: "array", items: { type: "string" } },
          timeSlots: { type: "array", items: { type: "string" } },
          feeRanges: { type: "array", items: { object: { allowedKeys: ["grade", "subject", "min", "max"], fields: { grade: { type: "string" }, subject: { type: "string" }, min: { type: "string" }, max: { type: "string" } } } } },
          abilityDescription: { type: "string" },
          proofImages: { type: "array", items: { object: { allowedKeys: ["name", "type", "size"], fields: { name: { type: "string" }, type: { type: "string" }, size: { type: "number" } } } } }
        }
      });

      if (!body.ok) {
        return body.response;
      }

      const result = await saveServerTutorProfile({
        authenticatedUserId: auth.authenticatedUserId,
        collection,
        input: body.value
      });

      return jsonResponse(result, statusForResult(result, 400));
    },

    async GET_ITEM(_request: Request, context: RouteContext) {
      const { id } = await context.params;
      const result = await findPublicServerTutorProfileById({ collection, id });

      if (!contactReviewGate.ok) return jsonResponse(contactReviewGate, 503);
      if (contactReviewGate.enabled) {
        if (!contactReview) return jsonResponse(contactReviewGate, 503);
        const authority = await contactReview.readPublic(id);
        if (!authority.ok) return jsonResponse(authority, authority.status);
        return jsonResponse(authority);
      }

      return jsonResponse(result);
    },

    async PATCH_ITEM(request: Request, context: RouteContext) {
      const auth = await readAuthenticatedUserIdWithRevocation(request, securedEnv);

      if (!auth.ok) {
        return auth.response;
      }

      const securityResponse = guardWriteRequest(request, securedEnv, auth.authenticatedUserId);
      if (securityResponse) return securityResponse;

      const body = await readJsonBody<TutorProfileInput>(request, {
        allowedKeys: ["gender", "school", "major", "subjects", "grades", "timeSlots", "feeRanges", "abilityDescription", "proofImages"],
        schema: {
          gender: { type: "string" }, school: { type: "string" }, major: { type: "string" },
          subjects: { type: "array", items: { type: "string" } },
          grades: { type: "array", items: { type: "string" } },
          timeSlots: { type: "array", items: { type: "string" } },
          feeRanges: { type: "array", items: { object: { allowedKeys: ["grade", "subject", "min", "max"], fields: { grade: { type: "string" }, subject: { type: "string" }, min: { type: "string" }, max: { type: "string" } } } } },
          abilityDescription: { type: "string" },
          proofImages: { type: "array", items: { object: { allowedKeys: ["name", "type", "size"], fields: { name: { type: "string" }, type: { type: "string" }, size: { type: "number" } } } } }
        }
      });

      if (!body.ok) {
        return body.response;
      }

      const { id } = await context.params;
      const result = await updateServerTutorProfile({
        authenticatedUserId: auth.authenticatedUserId,
        collection,
        id,
        input: body.value
      });

      return jsonResponse(result, statusForResult(result, 403));
    }
  };
}
