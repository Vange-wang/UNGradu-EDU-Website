import type { ContactProfileInput } from "@/features/profile/contact-profile";
import {
  jsonResponse,
  readJsonBody,
  readTemporaryAuthenticatedUserId,
  type RuntimeEnv
} from "@/server/api-utils";
import {
  readServerContactProfile,
  saveServerContactProfile
} from "@/server/contact-profiles";

type ContactProfileCollection = Parameters<typeof readServerContactProfile>[0]["collection"];

type ContactProfileApiDependencies = {
  collection: ContactProfileCollection;
  env?: RuntimeEnv;
};

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

      const body = await readJsonBody<ContactProfileInput>(request);

      if (!body.ok) {
        return body.response;
      }

      const result = await saveServerContactProfile({
        authenticatedUserId: auth.authenticatedUserId,
        collection,
        input: body.value
      });

      if (!result.ok) {
        return jsonResponse(result, result.errors.request ? 401 : 400);
      }

      return jsonResponse(result);
    }
  };
}
