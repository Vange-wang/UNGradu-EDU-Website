import type { ContactProfileInput } from "@/features/profile/contact-profile";
import {
  jsonResponse,
  guardWriteRequest,
  readJsonBody,
  readAuthenticatedUserIdWithRevocation,
  createSecurityRuntimeEnv,
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
  sessionRevocationGuard?: RuntimeEnv["sessionRevocationGuard"];
};

export function createContactProfileApiHandlers({
  collection,
  env = process.env,
  sessionRevocationGuard
}: ContactProfileApiDependencies) {
  const securedEnv: RuntimeEnv = createSecurityRuntimeEnv({
    ...env,
    sessionRevocationGuard: sessionRevocationGuard ?? env.sessionRevocationGuard
  });
  return {
    async GET(request: Request) {
      const auth = await readAuthenticatedUserIdWithRevocation(request, securedEnv);

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
      const auth = await readAuthenticatedUserIdWithRevocation(request, securedEnv);

      if (!auth.ok) {
        return auth.response;
      }

      const securityResponse = guardWriteRequest(request, securedEnv, auth.authenticatedUserId);
      if (securityResponse) return securityResponse;

      const body = await readJsonBody<ContactProfileInput>(request, {
        allowedKeys: ["phone", "wechat"],
        schema: {
          phone: { type: "string" },
          wechat: { type: "string" }
        }
      });

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
