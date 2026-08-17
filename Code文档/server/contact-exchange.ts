import type { ContactProfileInput } from "@/features/profile/contact-profile";
import { readServerContactProfile } from "@/server/contact-profiles";
import {
  createNormalizedObjectNotFoundFailure,
  evaluateScopedAccess
} from "@/server/security/access-policy";

export const CONTACT_EXCHANGE_REQUESTS_COLLECTION = "contact_exchange_requests";
export const CONVERSATIONS_COLLECTION = "conversations";

export type ServerContactExchangeRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "withdrawn"
  | "expired";

export type ServerContactExchangeRequestView = {
  id: string;
  conversationId: string;
  direction: "sent" | "received";
  status: ServerContactExchangeRequestStatus;
  secondConfirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ConversationDocument = {
  id?: string;
  participantUserIds?: string[];
  sourceId?: string;
  sourceType?: "parent-need" | "tutor-profile";
  sourceStatus?: "deleted" | "published";
  sourceVersion?: number;
  createdAt?: string;
};

type SourceDocument = {
  managementState?: "managed" | "legacy-readonly" | string;
  ownerUserId?: string;
  status?: string;
  version?: number;
};

type ContactExchangeRequestDocument = {
  approvalIdempotencyKey?: string;
  id?: string;
  conversationId?: string;
  requesterUserId?: string;
  receiverUserId?: string;
  status?: ServerContactExchangeRequestStatus;
  secondConfirmedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type DocumentCollection<T extends Record<string, unknown>> = {
  doc: (docId: string) => {
    get: () => Promise<{ data?: unknown[] | Record<string, unknown> }>;
    set: (data: T) => Promise<unknown>;
  };
  where: (query: Record<string, unknown>) => {
    get: () => Promise<{ data?: unknown[] }>;
  };
};

function firstDocument(result: { data?: unknown }) {
  const data = result.data;
  if (Array.isArray(data)) return data[0];
  return data && typeof data === "object" ? data : undefined;
}

type ContactProfileCollection = Parameters<typeof readServerContactProfile>[0]["collection"];

type ContactExchangeDependencies = {
  contactProfilesCollection: ContactProfileCollection;
  conversationsCollection: DocumentCollection<ConversationDocument>;
  parentNeedsCollection: DocumentCollection<SourceDocument>;
  requestsCollection: DocumentCollection<ContactExchangeRequestDocument>;
  tutorProfilesCollection: DocumentCollection<SourceDocument>;
};

type Failure = {
  ok: false;
  status: number;
  value: null;
  errors: { request: string };
};

type Success<T> = {
  ok: true;
  value: T;
  errors: Record<string, never>;
};

const CONTACT_EXCHANGE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

function normalizeUserId(userId: string) {
  return userId.trim();
}

function createOpaqueId(prefix: string) {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function resolveDocumentId(preallocatedId: string | undefined, prefix: string) {
  if (preallocatedId === undefined) {
    return createOpaqueId(prefix);
  }

  const normalizedId = preallocatedId.trim();
  return normalizedId.startsWith(`${prefix}-`) && normalizedId.length <= 160
    ? normalizedId
    : null;
}

function createFailure(message: string, status = 400): Failure {
  return {
    ok: false,
    status,
    value: null,
    errors: { request: message }
  };
}

function createAuthFailure() {
  return createFailure("必须登录后才能访问联系方式交换请求", 401);
}

function requireAuthenticatedUser(authenticatedUserId: string) {
  const currentUserId = normalizeUserId(authenticatedUserId);
  return currentUserId || null;
}

async function readConversation({
  conversationId,
  conversationsCollection
}: Pick<ContactExchangeDependencies, "conversationsCollection"> & {
  conversationId: string;
}) {
  const result = await conversationsCollection.doc(conversationId).get();
  const conversation = firstDocument(result) as ConversationDocument | undefined;

  if (!conversation?.participantUserIds?.length) {
    return null;
  }

  return {
    ...conversation,
    id: conversationId,
    participantUserIds: conversation.participantUserIds.map(normalizeUserId)
  };
}

async function isConversationSourceAvailable({
  conversation,
  parentNeedsCollection,
  tutorProfilesCollection
}: Pick<
  ContactExchangeDependencies,
  "parentNeedsCollection" | "tutorProfilesCollection"
> & {
  conversation: ConversationDocument;
}) {
  if (!conversation.sourceId || !conversation.sourceType) {
    return false;
  }

  const collection = conversation.sourceType === "parent-need"
    ? parentNeedsCollection
    : tutorProfilesCollection;
  const result = await collection.doc(conversation.sourceId).get();
  const source = firstDocument(result) as SourceDocument | undefined;

  if (source?.status !== "published" || source.managementState === "legacy-readonly") {
    return false;
  }

  return !Number.isInteger(conversation.sourceVersion) ||
    !Number.isInteger(source.version) ||
    conversation.sourceVersion === source.version;
}

function isParticipant(conversation: ConversationDocument, userId: string) {
  return conversation.participantUserIds?.includes(normalizeUserId(userId)) ?? false;
}

function findOtherParticipant(conversation: ConversationDocument, userId: string) {
  return conversation.participantUserIds?.find(
    (participantUserId) => participantUserId !== normalizeUserId(userId)
  ) ?? null;
}

function toRequestView(
  request: Required<
    Pick<
      ContactExchangeRequestDocument,
      | "conversationId"
      | "createdAt"
      | "id"
      | "receiverUserId"
      | "requesterUserId"
      | "secondConfirmedAt"
      | "status"
      | "updatedAt"
    >
  >,
  currentUserId: string
): ServerContactExchangeRequestView {
  return {
    id: request.id,
    conversationId: request.conversationId,
    direction: request.requesterUserId === currentUserId ? "sent" : "received",
    status: request.status,
    secondConfirmedAt: request.secondConfirmedAt,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt
  };
}

function normalizeRequest(
  request: ContactExchangeRequestDocument
): Required<
  Pick<
    ContactExchangeRequestDocument,
    | "conversationId"
    | "createdAt"
    | "id"
    | "receiverUserId"
    | "requesterUserId"
    | "secondConfirmedAt"
    | "status"
    | "updatedAt"
  >
> & Pick<ContactExchangeRequestDocument, "approvalIdempotencyKey"> | null {
  if (
    !request.id ||
    !request.conversationId ||
    !request.requesterUserId ||
    !request.receiverUserId ||
    !request.status ||
    !request.createdAt ||
    !request.updatedAt
  ) {
    return null;
  }

  return {
    id: request.id,
    conversationId: request.conversationId,
    requesterUserId: request.requesterUserId,
    receiverUserId: request.receiverUserId,
    status: request.status,
    approvalIdempotencyKey: request.approvalIdempotencyKey,
    secondConfirmedAt: request.secondConfirmedAt ?? null,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt
  };
}

function refreshExpiry<T extends ContactExchangeRequestDocument>(
  request: T,
  now: string
) {
  if (request.status !== "pending" || !request.createdAt) {
    return request;
  }

  const isExpired =
    new Date(now).getTime() - new Date(request.createdAt).getTime() >
    CONTACT_EXCHANGE_EXPIRY_MS;

  if (!isExpired) {
    return request;
  }

  return {
    ...request,
    status: "expired" as const,
    updatedAt: now
  };
}

async function readRequestById({
  requestId,
  requestsCollection
}: Pick<ContactExchangeDependencies, "requestsCollection"> & {
  requestId: string;
}) {
  const result = await requestsCollection.doc(requestId).get();
  const rawRequest = firstDocument(result) as ContactExchangeRequestDocument | undefined;

  if (!rawRequest) {
    return null;
  }

  return normalizeRequest({ ...rawRequest, id: requestId });
}

async function refreshAndPersistRequestExpiry({
  now,
  request,
  requestsCollection
}: Pick<ContactExchangeDependencies, "requestsCollection"> & {
  now: string;
  request: NonNullable<ReturnType<typeof normalizeRequest>>;
}) {
  const refreshedRequest = refreshExpiry(request, now);

  if (refreshedRequest !== request && refreshedRequest.status === "expired") {
    await requestsCollection.doc(request.id).set(refreshedRequest);
  }

  return refreshedRequest;
}

async function readRequestsForConversation({
  conversationId,
  now,
  requestsCollection
}: Pick<ContactExchangeDependencies, "requestsCollection"> & {
  conversationId: string;
  now: string;
}) {
  const result = await requestsCollection.where({ conversationId }).get();
  const requests = result.data ?? [];

  return Promise.all(
    requests.map(async (rawRequest) => {
      const request = rawRequest as ContactExchangeRequestDocument;
      const refreshedRequest = refreshExpiry(request, now);

      if (
        refreshedRequest.id &&
        refreshedRequest !== request &&
        refreshedRequest.status === "expired"
      ) {
        await requestsCollection.doc(refreshedRequest.id).set(refreshedRequest);
      }

      return normalizeRequest(refreshedRequest);
    })
  ).then((values) =>
    values
      .filter((request): request is NonNullable<typeof request> => Boolean(request))
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      )
  );
}

async function readValidatedContactProfile({
  authenticatedUserId,
  contactProfilesCollection
}: Pick<ContactExchangeDependencies, "contactProfilesCollection"> & {
  authenticatedUserId: string;
}) {
  const result = await readServerContactProfile({
    authenticatedUserId,
    collection: contactProfilesCollection
  });

  if (!result.ok || !result.value.phone) {
    return null;
  }

  return result.value;
}

export async function createServerContactExchangeRequest({
  authenticatedUserId,
  conversationId,
  conversationsCollection,
  now = new Date().toISOString(),
  parentNeedsCollection,
  preallocatedId,
  requestsCollection,
  tutorProfilesCollection
}: ContactExchangeDependencies & {
  authenticatedUserId: string;
  conversationId: string;
  now?: string;
  preallocatedId?: string;
}): Promise<Success<ServerContactExchangeRequestView> | Failure> {
  const currentUserId = requireAuthenticatedUser(authenticatedUserId);

  if (!currentUserId) {
    return createAuthFailure();
  }

  const conversation = await readConversation({
    conversationId,
    conversationsCollection
  });

  if (!conversation || !isParticipant(conversation, currentUserId)) {
    return createNormalizedObjectNotFoundFailure();
  }

  if (!(await isConversationSourceAvailable({
    conversation,
    parentNeedsCollection,
    tutorProfilesCollection
  }))) {
    return createFailure("关联发布已删除，暂不可交换联系方式", 403);
  }

  const receiverUserId = findOtherParticipant(conversation, currentUserId);

  if (!receiverUserId) {
    return createNormalizedObjectNotFoundFailure();
  }

  const requestedId = resolveDocumentId(preallocatedId, "contact-exchange");
  if (!requestedId) {
    return createFailure("联系方式交换请求标识无效", 400);
  }
  if (preallocatedId !== undefined) {
    const existing = await readRequestById({ requestId: requestedId, requestsCollection });
    if (existing) {
      return existing.conversationId === conversationId &&
        existing.requesterUserId === currentUserId &&
        existing.receiverUserId === receiverUserId
        ? { ok: true, value: toRequestView(existing, currentUserId), errors: {} }
        : createFailure("联系方式交换请求标识已被占用", 409);
    }
  }

  const request = {
    id: requestedId,
    conversationId,
    requesterUserId: currentUserId,
    receiverUserId,
    status: "pending" as const,
    secondConfirmedAt: null,
    createdAt: now,
    updatedAt: now
  };

  await requestsCollection.doc(request.id).set(request);

  return {
    ok: true,
    value: toRequestView(request, currentUserId),
    errors: {}
  };
}

export async function approveServerContactExchangeRequest({
  authenticatedUserId,
  approvalIdempotencyKey,
  contactProfilesCollection,
  conversationsCollection,
  now = new Date().toISOString(),
  parentNeedsCollection,
  requestId,
  requestsCollection,
  secondConfirmation,
  tutorProfilesCollection
}: ContactExchangeDependencies & {
  authenticatedUserId: string;
  approvalIdempotencyKey?: string;
  now?: string;
  requestId: string;
  secondConfirmation: boolean;
}): Promise<Success<ServerContactExchangeRequestView> | Failure> {
  const currentUserId = requireAuthenticatedUser(authenticatedUserId);

  if (!currentUserId) {
    return createAuthFailure();
  }

  let request = await readRequestById({ requestId, requestsCollection });

  if (!request || request.receiverUserId !== currentUserId) {
    return createNormalizedObjectNotFoundFailure();
  }

  request = await refreshAndPersistRequestExpiry({ now, request, requestsCollection });

  if (request.status === "expired") {
    return createFailure("联系方式交换请求已过期", 403);
  }

  const normalizedApprovalKey = approvalIdempotencyKey?.trim();
  const isMatchingApprovalReplay =
    request.status === "approved" &&
    Boolean(normalizedApprovalKey) &&
    request.approvalIdempotencyKey === normalizedApprovalKey;

  if (request.status !== "pending" && !isMatchingApprovalReplay) {
    return createFailure("只能处理待处理的联系方式交换请求", 403);
  }

  const conversation = await readConversation({
    conversationId: request.conversationId,
    conversationsCollection
  });

  if (
    !conversation ||
    !(await isConversationSourceAvailable({
      conversation,
      parentNeedsCollection,
      tutorProfilesCollection
    }))
  ) {
    return createFailure("关联发布已删除，暂不可交换联系方式", 403);
  }

  if (!secondConfirmation) {
    return createFailure("同意交换联系方式前必须完成二次确认", 403);
  }

  const requesterProfile = await readValidatedContactProfile({
    authenticatedUserId: request.requesterUserId,
    contactProfilesCollection
  });
  const receiverProfile = await readValidatedContactProfile({
    authenticatedUserId: request.receiverUserId,
    contactProfilesCollection
  });

  if (!requesterProfile || !receiverProfile) {
    return createFailure("双方都必须先填写存档手机号", 403);
  }

  if (isMatchingApprovalReplay) {
    return { ok: true, value: toRequestView(request, currentUserId), errors: {} };
  }

  const approvedRequest = {
    ...request,
    status: "approved" as const,
    secondConfirmedAt: now,
    ...(normalizedApprovalKey ? { approvalIdempotencyKey: normalizedApprovalKey } : {}),
    updatedAt: now
  };

  await requestsCollection.doc(request.id).set(approvedRequest);

  return {
    ok: true,
    value: toRequestView(approvedRequest, currentUserId),
    errors: {}
  };
}

export async function rejectServerContactExchangeRequest({
  authenticatedUserId,
  conversationsCollection,
  now = new Date().toISOString(),
  parentNeedsCollection,
  requestId,
  requestsCollection,
  tutorProfilesCollection
}: ContactExchangeDependencies & {
  authenticatedUserId: string;
  now?: string;
  requestId: string;
}): Promise<Success<ServerContactExchangeRequestView> | Failure> {
  const currentUserId = requireAuthenticatedUser(authenticatedUserId);

  if (!currentUserId) {
    return createAuthFailure();
  }

  let request = await readRequestById({ requestId, requestsCollection });

  if (!request || request.receiverUserId !== currentUserId) {
    return createNormalizedObjectNotFoundFailure();
  }

  request = await refreshAndPersistRequestExpiry({ now, request, requestsCollection });

  if (request.status !== "pending") {
    return createFailure("只能处理待处理的联系方式交换请求", 403);
  }

  const conversation = await readConversation({
    conversationId: request.conversationId,
    conversationsCollection
  });

  if (
    !conversation ||
    !(await isConversationSourceAvailable({
      conversation,
      parentNeedsCollection,
      tutorProfilesCollection
    }))
  ) {
    return createFailure("关联发布已删除，暂不可交换联系方式", 403);
  }

  const rejectedRequest = {
    ...request,
    status: "rejected" as const,
    updatedAt: now
  };

  await requestsCollection.doc(request.id).set(rejectedRequest);

  return {
    ok: true,
    value: toRequestView(rejectedRequest, currentUserId),
    errors: {}
  };
}

export async function withdrawServerContactExchangeRequest({
  authenticatedUserId,
  conversationsCollection,
  now = new Date().toISOString(),
  parentNeedsCollection,
  requestId,
  requestsCollection,
  tutorProfilesCollection
}: ContactExchangeDependencies & {
  authenticatedUserId: string;
  now?: string;
  requestId: string;
}): Promise<Success<ServerContactExchangeRequestView> | Failure> {
  const currentUserId = requireAuthenticatedUser(authenticatedUserId);

  if (!currentUserId) {
    return createAuthFailure();
  }

  let request = await readRequestById({ requestId, requestsCollection });

  if (!request || request.requesterUserId !== currentUserId) {
    return createNormalizedObjectNotFoundFailure();
  }

  request = await refreshAndPersistRequestExpiry({ now, request, requestsCollection });

  if (request.status !== "pending") {
    return createFailure("只能撤回待处理的联系方式交换请求", 403);
  }

  const conversation = await readConversation({
    conversationId: request.conversationId,
    conversationsCollection
  });

  if (
    !conversation ||
    !(await isConversationSourceAvailable({
      conversation,
      parentNeedsCollection,
      tutorProfilesCollection
    }))
  ) {
    return createFailure("关联发布已删除，暂不可交换联系方式", 403);
  }

  const withdrawnRequest = {
    ...request,
    status: "withdrawn" as const,
    updatedAt: now
  };

  await requestsCollection.doc(request.id).set(withdrawnRequest);

  return {
    ok: true,
    value: toRequestView(withdrawnRequest, currentUserId),
    errors: {}
  };
}

export async function listServerContactExchangeRequests({
  authenticatedUserId,
  conversationId,
  conversationsCollection,
  now = new Date().toISOString(),
  requestsCollection
}: ContactExchangeDependencies & {
  authenticatedUserId: string;
  conversationId: string;
  now?: string;
}): Promise<Success<ServerContactExchangeRequestView[]> | Failure> {
  const currentUserId = requireAuthenticatedUser(authenticatedUserId);

  if (!currentUserId) {
    return createAuthFailure();
  }

  const conversation = await readConversation({
    conversationId,
    conversationsCollection
  });

  if (!conversation || !isParticipant(conversation, currentUserId)) {
    return createNormalizedObjectNotFoundFailure();
  }

  const requests = await readRequestsForConversation({
    conversationId,
    now,
    requestsCollection
  });

  return {
    ok: true,
    value: requests.map((request) => toRequestView(request, currentUserId)),
    errors: {}
  };
}

export async function readServerAuthorizedContactProfiles({
  authenticatedUserId,
  contactProfilesCollection,
  conversationId,
  conversationsCollection,
  now = new Date().toISOString(),
  parentNeedsCollection,
  requestsCollection,
  tutorProfilesCollection
}: ContactExchangeDependencies & {
  authenticatedUserId: string;
  conversationId: string;
  now?: string;
}): Promise<
  Success<{
    currentUser: ContactProfileInput;
    otherUser: ContactProfileInput;
  } | null> | Failure
> {
  const currentUserId = requireAuthenticatedUser(authenticatedUserId);

  if (!currentUserId) {
    return createAuthFailure();
  }

  const conversation = await readConversation({
    conversationId,
    conversationsCollection
  });

  if (!conversation || !isParticipant(conversation, currentUserId)) {
    return createNormalizedObjectNotFoundFailure();
  }

  if (!(await isConversationSourceAvailable({
    conversation,
    parentNeedsCollection,
    tutorProfilesCollection
  }))) {
    return { ok: true, value: null, errors: {} };
  }

  const approvedRequest = (await readRequestsForConversation({
    conversationId,
    now,
    requestsCollection
  })).find(
    (request) => request.status === "approved" && request.secondConfirmedAt
  );

  if (!approvedRequest) {
    return {
      ok: true,
      value: null,
      errors: {}
    };
  }

  const sourceCollection = conversation.sourceType === "parent-need"
    ? parentNeedsCollection
    : tutorProfilesCollection;
  const sourceSnapshot = firstDocument(
    await sourceCollection.doc(conversation.sourceId ?? "").get()
  ) as SourceDocument | undefined;
  const access = evaluateScopedAccess({
    actorId: currentUserId,
    contactAuthorized: true,
    conversationSourceVersion: conversation.sourceVersion,
    ownerId: sourceSnapshot?.ownerUserId ?? "",
    participantIds: conversation.participantUserIds,
    requestState: approvedRequest.status,
    sourceStatus: sourceSnapshot?.status === "published" && sourceSnapshot.managementState !== "legacy-readonly"
      ? "published"
      : "deleted",
    sourceVersion: sourceSnapshot?.version
  });
  if (!access.ok || !access.contactVisible) {
    return { ok: true, value: null, errors: {} };
  }

  const otherUserId = findOtherParticipant(conversation, currentUserId);

  if (!otherUserId) {
    return {
      ok: true,
      value: null,
      errors: {}
    };
  }

  const currentUser = await readValidatedContactProfile({
    authenticatedUserId: currentUserId,
    contactProfilesCollection
  });
  const otherUser = await readValidatedContactProfile({
    authenticatedUserId: otherUserId,
    contactProfilesCollection
  });

  return {
    ok: true,
    value: currentUser && otherUser ? { currentUser, otherUser } : null,
    errors: {}
  };
}
