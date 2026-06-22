import {
  apiError,
  jsonResponse,
  readJsonBody,
  readTemporaryAuthenticatedUserId,
  statusForResult,
  type RuntimeEnv
} from "@/server/api-utils";
import {
  approveServerContactExchangeRequest,
  createServerContactExchangeRequest,
  listServerContactExchangeRequests,
  readServerAuthorizedContactProfiles,
  rejectServerContactExchangeRequest,
  withdrawServerContactExchangeRequest
} from "@/server/contact-exchange";

type ContactExchangeDependencies = Parameters<typeof createServerContactExchangeRequest>[0];

type ContactExchangeApiDependencies = Omit<
  ContactExchangeDependencies,
  "authenticatedUserId" | "conversationId"
> & {
  env?: RuntimeEnv;
};

type ContactExchangeActionBody =
  | {
      action: "create";
      conversationId: string;
      now?: string;
    }
  | {
      action: "approve";
      now?: string;
      requestId: string;
      secondConfirmation: boolean;
    }
  | {
      action: "reject" | "withdraw";
      now?: string;
      requestId: string;
    };

export function createContactExchangeApiHandlers({
  contactProfilesCollection,
  conversationsCollection,
  env = process.env,
  requestsCollection
}: ContactExchangeApiDependencies) {
  return {
    async GET(request: Request) {
      const auth = readTemporaryAuthenticatedUserId(request, env);

      if (!auth.ok) {
        return auth.response;
      }

      const url = new URL(request.url);
      const conversationId = url.searchParams.get("conversationId")?.trim();

      if (!conversationId) {
        return apiError(400, "Missing conversation id.");
      }

      if (url.searchParams.get("view") === "authorized-profiles") {
        const result = await readServerAuthorizedContactProfiles({
          authenticatedUserId: auth.authenticatedUserId,
          contactProfilesCollection,
          conversationId,
          conversationsCollection,
          requestsCollection
        });

        return jsonResponse(result, statusForResult(result, 403));
      }

      const result = await listServerContactExchangeRequests({
        authenticatedUserId: auth.authenticatedUserId,
        contactProfilesCollection,
        conversationId,
        conversationsCollection,
        requestsCollection
      });

      return jsonResponse(result, statusForResult(result, 403));
    },

    async POST(request: Request) {
      const auth = readTemporaryAuthenticatedUserId(request, env);

      if (!auth.ok) {
        return auth.response;
      }

      const body = await readJsonBody<Partial<ContactExchangeActionBody>>(request);

      if (!body.ok) {
        return body.response;
      }

      if (body.value.action === "create" && body.value.conversationId) {
        const result = await createServerContactExchangeRequest({
          authenticatedUserId: auth.authenticatedUserId,
          contactProfilesCollection,
          conversationId: body.value.conversationId,
          conversationsCollection,
          now: body.value.now,
          requestsCollection
        });

        return jsonResponse(result, statusForResult(result, 403));
      }

      if (body.value.action === "approve" && body.value.requestId) {
        const result = await approveServerContactExchangeRequest({
          authenticatedUserId: auth.authenticatedUserId,
          contactProfilesCollection,
          conversationsCollection,
          now: body.value.now,
          requestId: body.value.requestId,
          requestsCollection,
          secondConfirmation: Boolean(body.value.secondConfirmation)
        });

        return jsonResponse(result, statusForResult(result, 403));
      }

      if (body.value.action === "reject" && body.value.requestId) {
        const result = await rejectServerContactExchangeRequest({
          authenticatedUserId: auth.authenticatedUserId,
          contactProfilesCollection,
          conversationsCollection,
          now: body.value.now,
          requestId: body.value.requestId,
          requestsCollection
        });

        return jsonResponse(result, statusForResult(result, 403));
      }

      if (body.value.action === "withdraw" && body.value.requestId) {
        const result = await withdrawServerContactExchangeRequest({
          authenticatedUserId: auth.authenticatedUserId,
          contactProfilesCollection,
          conversationsCollection,
          now: body.value.now,
          requestId: body.value.requestId,
          requestsCollection
        });

        return jsonResponse(result, statusForResult(result, 403));
      }

      return apiError(400, "Unsupported contact exchange action.");
    }
  };
}
