import type { TutorProfileInput } from "@/features/tutor-profiles/tutor-profile";
import {
  jsonResponse,
  readJsonBody,
  readTemporaryAuthenticatedUserId,
  statusForResult,
  type RuntimeEnv
} from "@/server/api-utils";
import {
  findPublicServerTutorProfileById,
  listPublicServerTutorProfiles,
  listServerTutorProfilesForOwner,
  saveServerTutorProfile
} from "@/server/tutor-profiles";

type TutorProfileCollection = Parameters<typeof saveServerTutorProfile>[0]["collection"];

type RouteContext = {
  params: Promise<{ id: string }>;
};

export function createTutorProfileApiHandlers({
  collection,
  env = process.env
}: {
  collection: TutorProfileCollection;
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

        const result = await listServerTutorProfilesForOwner({
          authenticatedUserId: auth.authenticatedUserId,
          collection
        });

        return jsonResponse(result, statusForResult(result, 400));
      }

      const result = await listPublicServerTutorProfiles({
        collection,
        filters: {
          feeMax: url.searchParams.get("feeMax") ?? undefined,
          feeMin: url.searchParams.get("feeMin") ?? undefined,
          gender: url.searchParams.get("gender") ?? undefined,
          grade: url.searchParams.get("grade") ?? undefined,
          subject: url.searchParams.get("subject") ?? undefined
        }
      });

      return jsonResponse(result);
    },

    async POST_COLLECTION(request: Request) {
      const auth = readTemporaryAuthenticatedUserId(request, env);

      if (!auth.ok) {
        return auth.response;
      }

      const body = await readJsonBody<TutorProfileInput>(request);

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

      return jsonResponse(result);
    }
  };
}
