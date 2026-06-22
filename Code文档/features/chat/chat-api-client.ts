import type { ContactProfileInput } from "@/features/profile/contact-profile";
import type { ServerContactExchangeRequestView } from "@/server/contact-exchange";
import type {
  ServerConversationMessageView,
  ServerConversationSourceType,
  ServerConversationView
} from "@/server/conversations";

type ApiResult<T> =
  | {
      ok: true;
      value: T;
      errors: Record<string, never>;
    }
  | {
      ok: false;
      value: null;
      errors: { request?: string };
    };

type ChatApiClientInput = {
  currentUserPhone: string;
  fetcher?: typeof fetch;
};

type AuthorizedProfiles = {
  currentUser: ContactProfileInput;
  otherUser: ContactProfileInput;
} | null;

function createTemporaryIdentityHeaders(currentUserPhone: string) {
  return {
    "content-type": "application/json",
    "x-ungradu-test-user-phone": currentUserPhone.trim()
  };
}

async function parseApiResponse<T>(response: Response) {
  return await response.json() as ApiResult<T>;
}

function encodePathSegment(value: string) {
  return encodeURIComponent(value);
}

export async function readConversationsFromApi({
  currentUserPhone,
  fetcher = fetch
}: ChatApiClientInput) {
  const response = await fetcher("/api/conversations", {
    headers: createTemporaryIdentityHeaders(currentUserPhone),
    method: "GET"
  });

  return parseApiResponse<ServerConversationView[]>(response);
}

export async function createConversationFromSourceToApi({
  currentUserPhone,
  fetcher = fetch,
  sourceId,
  sourceType
}: ChatApiClientInput & {
  sourceId: string;
  sourceType: ServerConversationSourceType;
}) {
  const response = await fetcher("/api/conversations", {
    body: JSON.stringify({ sourceId, sourceType }),
    headers: createTemporaryIdentityHeaders(currentUserPhone),
    method: "POST"
  });

  return parseApiResponse<ServerConversationView>(response);
}

export async function readConversationFromApi({
  conversationId,
  currentUserPhone,
  fetcher = fetch
}: ChatApiClientInput & { conversationId: string }) {
  const response = await fetcher(
    `/api/conversations/${encodePathSegment(conversationId)}`,
    {
      headers: createTemporaryIdentityHeaders(currentUserPhone),
      method: "GET"
    }
  );

  return parseApiResponse<ServerConversationView | null>(response);
}

export async function readConversationMessagesFromApi({
  conversationId,
  currentUserPhone,
  fetcher = fetch
}: ChatApiClientInput & { conversationId: string }) {
  const response = await fetcher(
    `/api/conversations/${encodePathSegment(conversationId)}/messages`,
    {
      headers: createTemporaryIdentityHeaders(currentUserPhone),
      method: "GET"
    }
  );

  return parseApiResponse<ServerConversationMessageView[]>(response);
}

export async function sendConversationMessageToApi({
  conversationId,
  currentUserPhone,
  fetcher = fetch,
  text
}: ChatApiClientInput & { conversationId: string; text: string }) {
  const response = await fetcher(
    `/api/conversations/${encodePathSegment(conversationId)}/messages`,
    {
      body: JSON.stringify({ text }),
      headers: createTemporaryIdentityHeaders(currentUserPhone),
      method: "POST"
    }
  );

  return parseApiResponse<ServerConversationMessageView>(response);
}

export async function listContactExchangeRequestsFromApi({
  conversationId,
  currentUserPhone,
  fetcher = fetch
}: ChatApiClientInput & { conversationId: string }) {
  const response = await fetcher(
    `/api/contact-exchange?conversationId=${encodeURIComponent(conversationId)}`,
    {
      headers: createTemporaryIdentityHeaders(currentUserPhone),
      method: "GET"
    }
  );

  return parseApiResponse<ServerContactExchangeRequestView[]>(response);
}

export async function readAuthorizedContactProfilesFromApi({
  conversationId,
  currentUserPhone,
  fetcher = fetch
}: ChatApiClientInput & { conversationId: string }) {
  const response = await fetcher(
    `/api/contact-exchange?conversationId=${encodeURIComponent(conversationId)}&view=authorized-profiles`,
    {
      headers: createTemporaryIdentityHeaders(currentUserPhone),
      method: "GET"
    }
  );

  return parseApiResponse<AuthorizedProfiles>(response);
}

export async function createContactExchangeRequestFromApi({
  conversationId,
  currentUserPhone,
  fetcher = fetch
}: ChatApiClientInput & { conversationId: string }) {
  const response = await fetcher("/api/contact-exchange", {
    body: JSON.stringify({ action: "create", conversationId }),
    headers: createTemporaryIdentityHeaders(currentUserPhone),
    method: "POST"
  });

  return parseApiResponse<ServerContactExchangeRequestView>(response);
}

export async function approveContactExchangeRequestFromApi({
  currentUserPhone,
  fetcher = fetch,
  requestId,
  secondConfirmation
}: ChatApiClientInput & {
  requestId: string;
  secondConfirmation: boolean;
}) {
  const response = await fetcher("/api/contact-exchange", {
    body: JSON.stringify({
      action: "approve",
      requestId,
      secondConfirmation
    }),
    headers: createTemporaryIdentityHeaders(currentUserPhone),
    method: "POST"
  });

  return parseApiResponse<ServerContactExchangeRequestView>(response);
}

export async function rejectContactExchangeRequestFromApi({
  currentUserPhone,
  fetcher = fetch,
  requestId
}: ChatApiClientInput & { requestId: string }) {
  const response = await fetcher("/api/contact-exchange", {
    body: JSON.stringify({ action: "reject", requestId }),
    headers: createTemporaryIdentityHeaders(currentUserPhone),
    method: "POST"
  });

  return parseApiResponse<ServerContactExchangeRequestView>(response);
}

export async function withdrawContactExchangeRequestFromApi({
  currentUserPhone,
  fetcher = fetch,
  requestId
}: ChatApiClientInput & { requestId: string }) {
  const response = await fetcher("/api/contact-exchange", {
    body: JSON.stringify({ action: "withdraw", requestId }),
    headers: createTemporaryIdentityHeaders(currentUserPhone),
    method: "POST"
  });

  return parseApiResponse<ServerContactExchangeRequestView>(response);
}
