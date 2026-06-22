import type { KeyValueStorage } from "@/lib/storage";

import { readContactProfile } from "@/features/profile/contact-profile-storage";

export type ConversationSourceType = "parent-need" | "tutor-profile";

type StoredConversation = {
  id: string;
  participantPhones: [string, string];
  sourceId: string;
  sourceType: ConversationSourceType;
  createdAt: string;
};

export type SavedConversation = {
  id: string;
  sourceId: string;
  sourceType: ConversationSourceType;
  createdAt: string;
};

type StoredConversationMessage = {
  id: string;
  conversationId: string;
  senderPhone: string;
  text: string;
  createdAt: string;
};

export type SavedConversationMessage = {
  id: string;
  conversationId: string;
  direction: "sent" | "received";
  text: string;
  createdAt: string;
};

export type ContactExchangeRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "withdrawn"
  | "expired";

type StoredContactExchangeRequest = {
  id: string;
  conversationId: string;
  requesterPhone: string;
  receiverPhone: string;
  status: ContactExchangeRequestStatus;
  secondConfirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SavedContactExchangeRequest = {
  id: string;
  conversationId: string;
  direction: "sent" | "received";
  status: ContactExchangeRequestStatus;
  secondConfirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type StorageInput = {
  storage: KeyValueStorage;
};

type Failure = {
  ok: false;
  value: null;
  errors: { request: string };
};

type Success<T> = {
  ok: true;
  value: T;
  errors: Record<string, never>;
};

const CONVERSATIONS_KEY = "ungradu.chat.conversations";
const MESSAGES_KEY = "ungradu.chat.messages";
const CONTACT_EXCHANGE_REQUESTS_KEY = "ungradu.chat.contactExchangeRequests";
const CONTACT_EXCHANGE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

function normalizePhone(phone: string) {
  return phone.trim();
}

function createOpaqueId(prefix: string) {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function readJsonArray<T>(storage: KeyValueStorage, key: string): T[] {
  const rawValue = storage.getItem(key);

  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}

function writeJsonArray<T>(storage: KeyValueStorage, key: string, values: T[]) {
  storage.setItem(key, JSON.stringify(values));
}

function isParticipant(conversation: StoredConversation, phone: string) {
  return conversation.participantPhones.includes(normalizePhone(phone));
}

function findConversation(conversationId: string, storage: KeyValueStorage) {
  return readJsonArray<StoredConversation>(storage, CONVERSATIONS_KEY).find(
    (conversation) => conversation.id === conversationId
  ) ?? null;
}

function toConversationView(conversation: StoredConversation): SavedConversation {
  return {
    id: conversation.id,
    sourceId: conversation.sourceId,
    sourceType: conversation.sourceType,
    createdAt: conversation.createdAt
  };
}

function toMessageView(
  message: StoredConversationMessage,
  currentUserPhone: string
): SavedConversationMessage {
  return {
    id: message.id,
    conversationId: message.conversationId,
    direction:
      message.senderPhone === normalizePhone(currentUserPhone) ? "sent" : "received",
    text: message.text,
    createdAt: message.createdAt
  };
}

function toContactExchangeRequestView(
  request: StoredContactExchangeRequest,
  currentUserPhone: string
): SavedContactExchangeRequest {
  return {
    id: request.id,
    conversationId: request.conversationId,
    direction:
      request.requesterPhone === normalizePhone(currentUserPhone)
        ? "sent"
        : "received",
    status: request.status,
    secondConfirmedAt: request.secondConfirmedAt,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt
  };
}

function createFailure(message: string): Failure {
  return {
    ok: false,
    value: null,
    errors: { request: message }
  };
}

function isExpired(request: StoredContactExchangeRequest, now: string) {
  return new Date(now).getTime() - new Date(request.createdAt).getTime() >
    CONTACT_EXCHANGE_EXPIRY_MS;
}

function refreshRequestExpiry(
  request: StoredContactExchangeRequest,
  now: string
) {
  if (request.status !== "pending" || !isExpired(request, now)) {
    return request;
  }

  return {
    ...request,
    status: "expired" as const,
    updatedAt: now
  };
}

function readContactExchangeRequests({
  now = new Date().toISOString(),
  storage
}: StorageInput & { now?: string }) {
  const requests = readJsonArray<StoredContactExchangeRequest>(
    storage,
    CONTACT_EXCHANGE_REQUESTS_KEY
  );
  let changed = false;
  const refreshedRequests = requests.map((request) => {
    const refreshedRequest = refreshRequestExpiry(request, now);
    changed = changed || refreshedRequest !== request;
    return refreshedRequest;
  });

  if (changed) {
    writeJsonArray(storage, CONTACT_EXCHANGE_REQUESTS_KEY, refreshedRequests);
  }

  return refreshedRequests;
}

function updateContactExchangeRequest({
  request,
  storage
}: StorageInput & { request: StoredContactExchangeRequest }) {
  const requests = readJsonArray<StoredContactExchangeRequest>(
    storage,
    CONTACT_EXCHANGE_REQUESTS_KEY
  );

  writeJsonArray(
    storage,
    CONTACT_EXCHANGE_REQUESTS_KEY,
    requests.map((currentRequest) =>
      currentRequest.id === request.id ? request : currentRequest
    )
  );
}

export function createOrReadConversation({
  currentUserPhone,
  otherUserPhone,
  sourceId,
  sourceType,
  storage
}: StorageInput & {
  currentUserPhone: string;
  otherUserPhone: string;
  sourceId: string;
  sourceType: ConversationSourceType;
}): Success<SavedConversation> | Failure {
  const currentPhone = normalizePhone(currentUserPhone);
  const otherPhone = normalizePhone(otherUserPhone);

  if (!currentPhone || !otherPhone || currentPhone === otherPhone) {
    return createFailure("聊天会话必须包含两个不同用户");
  }

  const conversations = readJsonArray<StoredConversation>(
    storage,
    CONVERSATIONS_KEY
  );
  const participants = [currentPhone, otherPhone].sort();
  const existingConversation = conversations.find((conversation) =>
    conversation.sourceType === sourceType &&
    conversation.sourceId === sourceId &&
    conversation.participantPhones.every((phone) => participants.includes(phone))
  );

  if (existingConversation) {
    return {
      ok: true,
      value: toConversationView(existingConversation),
      errors: {}
    };
  }

  const conversation: StoredConversation = {
    id: createOpaqueId("conversation"),
    participantPhones: [participants[0], participants[1]],
    sourceId,
    sourceType,
    createdAt: new Date().toISOString()
  };

  writeJsonArray(storage, CONVERSATIONS_KEY, [conversation, ...conversations]);

  return {
    ok: true,
    value: toConversationView(conversation),
    errors: {}
  };
}

export function readConversationForUser({
  conversationId,
  currentUserPhone,
  storage
}: StorageInput & {
  conversationId: string;
  currentUserPhone: string;
}) {
  const conversation = findConversation(conversationId, storage);

  if (!conversation || !isParticipant(conversation, currentUserPhone)) {
    return null;
  }

  return toConversationView(conversation);
}

export function readConversationsForUser({
  currentUserPhone,
  storage
}: StorageInput & { currentUserPhone: string }) {
  return readJsonArray<StoredConversation>(storage, CONVERSATIONS_KEY)
    .filter((conversation) => isParticipant(conversation, currentUserPhone))
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    )
    .map(toConversationView);
}

export function sendConversationMessage({
  conversationId,
  senderPhone,
  storage,
  text
}: StorageInput & {
  conversationId: string;
  senderPhone: string;
  text: string;
}): Success<SavedConversationMessage> | Failure {
  const conversation = readConversationForUser({
    conversationId,
    currentUserPhone: senderPhone,
    storage
  });
  const normalizedText = text.trim();

  if (!conversation) {
    return createFailure("只有会话参与者可以发送消息");
  }

  if (!normalizedText) {
    return createFailure("消息内容不能为空");
  }

  const messages = readJsonArray<StoredConversationMessage>(storage, MESSAGES_KEY);
  const message: StoredConversationMessage = {
    id: createOpaqueId("message"),
    conversationId,
    senderPhone: normalizePhone(senderPhone),
    text: normalizedText,
    createdAt: new Date().toISOString()
  };

  writeJsonArray(storage, MESSAGES_KEY, [...messages, message]);

  return {
    ok: true,
    value: toMessageView(message, senderPhone),
    errors: {}
  };
}

export function listConversationMessages({
  conversationId,
  currentUserPhone,
  storage
}: StorageInput & {
  conversationId: string;
  currentUserPhone: string;
}) {
  const conversation = readConversationForUser({
    conversationId,
    currentUserPhone,
    storage
  });

  if (!conversation) {
    return [];
  }

  return readJsonArray<StoredConversationMessage>(storage, MESSAGES_KEY)
    .filter((message) => message.conversationId === conversationId)
    .sort(
      (left, right) =>
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    )
    .map((message) => toMessageView(message, currentUserPhone));
}

export function createContactExchangeRequest({
  conversationId,
  createdAt = new Date().toISOString(),
  requesterPhone,
  storage
}: StorageInput & {
  conversationId: string;
  createdAt?: string;
  requesterPhone: string;
}): Success<SavedContactExchangeRequest> | Failure {
  const conversation = readConversationForUser({
    conversationId,
    currentUserPhone: requesterPhone,
    storage
  });

  if (!conversation) {
    return createFailure("只有会话参与者可以请求交换联系方式");
  }

  const requester = normalizePhone(requesterPhone);
  const storedConversation = findConversation(conversationId, storage);
  const receiver = storedConversation?.participantPhones.find(
    (phone) => phone !== requester
  );

  if (!receiver) {
    return createFailure("无法找到联系方式交换接收方");
  }

  const request: StoredContactExchangeRequest = {
    id: createOpaqueId("contact-exchange"),
    conversationId,
    requesterPhone: requester,
    receiverPhone: receiver,
    status: "pending",
    secondConfirmedAt: null,
    createdAt,
    updatedAt: createdAt
  };
  const requests = readContactExchangeRequests({ storage });

  writeJsonArray(storage, CONTACT_EXCHANGE_REQUESTS_KEY, [
    request,
    ...requests
  ]);

  return {
    ok: true,
    value: toContactExchangeRequestView(request, requesterPhone),
    errors: {}
  };
}

export function approveContactExchangeRequest({
  confirmerPhone,
  now = new Date().toISOString(),
  requestId,
  secondConfirmation,
  storage
}: StorageInput & {
  confirmerPhone: string;
  now?: string;
  requestId: string;
  secondConfirmation: boolean;
}): Success<SavedContactExchangeRequest> | Failure {
  const request = readContactExchangeRequests({ now, storage }).find(
    (currentRequest) => currentRequest.id === requestId
  );

  if (!request || request.receiverPhone !== normalizePhone(confirmerPhone)) {
    return createFailure("只能处理发给自己的联系方式交换请求");
  }

  if (request.status === "expired") {
    return createFailure("联系方式交换请求已过期");
  }

  if (request.status !== "pending") {
    return createFailure("只能处理待处理的联系方式交换请求");
  }

  if (!secondConfirmation) {
    return createFailure("同意交换联系方式前必须完成二次确认");
  }

  const requesterProfile = readContactProfile({
    ownerPhone: request.requesterPhone,
    storage
  });
  const receiverProfile = readContactProfile({
    ownerPhone: request.receiverPhone,
    storage
  });

  if (!requesterProfile || !receiverProfile) {
    return createFailure("双方都必须先填写存档手机号");
  }

  const approvedRequest: StoredContactExchangeRequest = {
    ...request,
    status: "approved",
    secondConfirmedAt: now,
    updatedAt: now
  };

  updateContactExchangeRequest({ request: approvedRequest, storage });

  return {
    ok: true,
    value: toContactExchangeRequestView(approvedRequest, confirmerPhone),
    errors: {}
  };
}

export function rejectContactExchangeRequest({
  receiverPhone,
  requestId,
  storage
}: StorageInput & {
  receiverPhone: string;
  requestId: string;
}): Success<SavedContactExchangeRequest> | Failure {
  const now = new Date().toISOString();
  const request = readContactExchangeRequests({ now, storage }).find(
    (currentRequest) => currentRequest.id === requestId
  );

  if (!request || request.receiverPhone !== normalizePhone(receiverPhone)) {
    return createFailure("只能处理发给自己的联系方式交换请求");
  }

  if (request.status !== "pending") {
    return createFailure("只能处理待处理的联系方式交换请求");
  }

  const rejectedRequest: StoredContactExchangeRequest = {
    ...request,
    status: "rejected",
    updatedAt: now
  };

  updateContactExchangeRequest({ request: rejectedRequest, storage });

  return {
    ok: true,
    value: toContactExchangeRequestView(rejectedRequest, receiverPhone),
    errors: {}
  };
}

export function withdrawContactExchangeRequest({
  requesterPhone,
  requestId,
  storage
}: StorageInput & {
  requesterPhone: string;
  requestId: string;
}): Success<SavedContactExchangeRequest> | Failure {
  const now = new Date().toISOString();
  const request = readContactExchangeRequests({ now, storage }).find(
    (currentRequest) => currentRequest.id === requestId
  );

  if (!request || request.requesterPhone !== normalizePhone(requesterPhone)) {
    return createFailure("只能撤回自己发起的联系方式交换请求");
  }

  if (request.status !== "pending") {
    return createFailure("只能撤回待处理的联系方式交换请求");
  }

  const withdrawnRequest: StoredContactExchangeRequest = {
    ...request,
    status: "withdrawn",
    updatedAt: now
  };

  updateContactExchangeRequest({ request: withdrawnRequest, storage });

  return {
    ok: true,
    value: toContactExchangeRequestView(withdrawnRequest, requesterPhone),
    errors: {}
  };
}

export function listContactExchangeRequestsForConversation({
  conversationId,
  currentUserPhone,
  storage
}: StorageInput & {
  conversationId: string;
  currentUserPhone: string;
}) {
  const conversation = readConversationForUser({
    conversationId,
    currentUserPhone,
    storage
  });

  if (!conversation) {
    return [];
  }

  return readContactExchangeRequests({ storage })
    .filter((request) => request.conversationId === conversationId)
    .sort(
      (left, right) =>
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    )
    .map((request) =>
      toContactExchangeRequestView(request, currentUserPhone)
    );
}

export function readAuthorizedContactProfiles({
  conversationId,
  currentUserPhone,
  storage
}: StorageInput & {
  conversationId: string;
  currentUserPhone: string;
}) {
  const conversation = readConversationForUser({
    conversationId,
    currentUserPhone,
    storage
  });

  if (!conversation) {
    return null;
  }

  const approvedRequest = readContactExchangeRequests({ storage }).find(
    (request) =>
      request.conversationId === conversationId &&
      request.status === "approved" &&
      request.secondConfirmedAt
  );

  if (!approvedRequest) {
    return null;
  }

  const currentPhone = normalizePhone(currentUserPhone);
  const storedConversation = findConversation(conversationId, storage);
  const otherPhone = storedConversation?.participantPhones.find(
    (phone) => phone !== currentPhone
  );

  if (!otherPhone) {
    return null;
  }

  const currentUser = readContactProfile({ ownerPhone: currentPhone, storage });
  const otherUser = readContactProfile({ ownerPhone: otherPhone, storage });

  if (!currentUser || !otherUser) {
    return null;
  }

  return {
    currentUser,
    otherUser
  };
}
