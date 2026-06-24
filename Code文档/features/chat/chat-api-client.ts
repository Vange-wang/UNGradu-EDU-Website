import type { ContactProfileInput } from "@/features/profile/contact-profile";
import { parseApiResponse } from "@/features/api/api-client";
import type { ServerContactExchangeRequestView } from "@/server/contact-exchange";
import type {
  ServerConversationMessageView,
  ServerConversationSourceType,
  ServerConversationView
} from "@/server/conversations";

type ChatApiClientInput = {
  currentUserPhone: string;
  fetcher?: typeof fetch;
};

type AuthorizedProfiles = {
  currentUser: ContactProfileInput;
  otherUser: ContactProfileInput;
} | null;

function createCookieBackedHeaders() {
  return {
    "content-type": "application/json"
  };
}

function encodePathSegment(value: string) {
  return encodeURIComponent(value);
}

export async function readConversationsFromApi({
  fetcher = fetch
}: ChatApiClientInput) {
  const response = await fetcher("/api/conversations", {
    credentials: "same-origin",
    headers: createCookieBackedHeaders(),
    method: "GET"
  });

  return parseApiResponse<ServerConversationView[]>(response);
}

export async function createConversationFromSourceToApi({
  fetcher = fetch,
  sourceId,
  sourceType
}: ChatApiClientInput & {
  sourceId: string;
  sourceType: ServerConversationSourceType;
}) {
  const response = await fetcher("/api/conversations", {
    body: JSON.stringify({ sourceId, sourceType }),
    credentials: "same-origin",
    headers: createCookieBackedHeaders(),
    method: "POST"
  });

  return parseApiResponse<ServerConversationView>(response);
}

export async function readConversationFromApi({
  conversationId,
  fetcher = fetch
}: ChatApiClientInput & { conversationId: string }) {
  const response = await fetcher(
    `/api/conversations/${encodePathSegment(conversationId)}`,
    {
      credentials: "same-origin",
      headers: createCookieBackedHeaders(),
      method: "GET"
    }
  );

  return parseApiResponse<ServerConversationView | null>(response);
}

export async function readConversationMessagesFromApi({
  conversationId,
  fetcher = fetch
}: ChatApiClientInput & { conversationId: string }) {
  const response = await fetcher(
    `/api/conversations/${encodePathSegment(conversationId)}/messages`,
    {
      credentials: "same-origin",
      headers: createCookieBackedHeaders(),
      method: "GET"
    }
  );

  return parseApiResponse<ServerConversationMessageView[]>(response);
}

export async function sendConversationMessageToApi({
  conversationId,
  fetcher = fetch,
  text
}: ChatApiClientInput & { conversationId: string; text: string }) {
  const response = await fetcher(
    `/api/conversations/${encodePathSegment(conversationId)}/messages`,
    {
      body: JSON.stringify({ text }),
      credentials: "same-origin",
      headers: createCookieBackedHeaders(),
      method: "POST"
    }
  );

  return parseApiResponse<ServerConversationMessageView>(response);
}

export async function listContactExchangeRequestsFromApi({
  conversationId,
  fetcher = fetch
}: ChatApiClientInput & { conversationId: string }) {
  const response = await fetcher(
    `/api/contact-exchange?conversationId=${encodeURIComponent(conversationId)}`,
    {
      credentials: "same-origin",
      headers: createCookieBackedHeaders(),
      method: "GET"
    }
  );

  return parseApiResponse<ServerContactExchangeRequestView[]>(response);
}

export async function readAuthorizedContactProfilesFromApi({
  conversationId,
  fetcher = fetch
}: ChatApiClientInput & { conversationId: string }) {
  const response = await fetcher(
    `/api/contact-exchange?conversationId=${encodeURIComponent(conversationId)}&view=authorized-profiles`,
    {
      credentials: "same-origin",
      headers: createCookieBackedHeaders(),
      method: "GET"
    }
  );

  return parseApiResponse<AuthorizedProfiles>(response);
}

export async function createContactExchangeRequestFromApi({
  conversationId,
  fetcher = fetch
}: ChatApiClientInput & { conversationId: string }) {
  const response = await fetcher("/api/contact-exchange", {
    body: JSON.stringify({ action: "create", conversationId }),
    credentials: "same-origin",
    headers: createCookieBackedHeaders(),
    method: "POST"
  });

  return parseApiResponse<ServerContactExchangeRequestView>(response);
}

export async function approveContactExchangeRequestFromApi({
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
    credentials: "same-origin",
    headers: createCookieBackedHeaders(),
    method: "POST"
  });

  return parseApiResponse<ServerContactExchangeRequestView>(response);
}

export async function rejectContactExchangeRequestFromApi({
  fetcher = fetch,
  requestId
}: ChatApiClientInput & { requestId: string }) {
  const response = await fetcher("/api/contact-exchange", {
    body: JSON.stringify({ action: "reject", requestId }),
    credentials: "same-origin",
    headers: createCookieBackedHeaders(),
    method: "POST"
  });

  return parseApiResponse<ServerContactExchangeRequestView>(response);
}

export async function withdrawContactExchangeRequestFromApi({
  fetcher = fetch,
  requestId
}: ChatApiClientInput & { requestId: string }) {
  const response = await fetcher("/api/contact-exchange", {
    body: JSON.stringify({ action: "withdraw", requestId }),
    credentials: "same-origin",
    headers: createCookieBackedHeaders(),
    method: "POST"
  });

  return parseApiResponse<ServerContactExchangeRequestView>(response);
}
