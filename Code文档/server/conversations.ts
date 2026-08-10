export const CONVERSATIONS_COLLECTION = "conversations";
export const CONVERSATION_MESSAGES_COLLECTION = "messages";

export type ServerConversationSourceType = "parent-need" | "tutor-profile";

export type ServerConversationView = {
  id: string;
  sourceId: string;
  sourceType: ServerConversationSourceType;
  sourceStatus: "deleted" | "published";
  readOnly: boolean;
  createdAt: string;
};

export type ServerConversationMessageView = {
  id: string;
  conversationId: string;
  direction: "sent" | "received";
  text: string;
  createdAt: string;
};

type SourceDocument = {
  id?: string;
  managementState?: "managed" | "legacy-readonly" | string;
  ownerUserId?: string;
  status?: string;
  version?: number;
};

type ConversationDocument = {
  conversationUniqKey?: string;
  id?: string;
  participantKeys?: string[];
  participantUserIds?: string[];
  sourceId?: string;
  sourceKey?: string;
  sourceType?: ServerConversationSourceType;
  sourceVersion?: number;
  createdAt?: string;
};

type ConversationMessageDocument = {
  id?: string;
  conversationId?: string;
  senderUserId?: string;
  text?: string;
  createdAt?: string;
};

type DocumentCollection<T extends Record<string, unknown>> = {
  doc: (docId: string) => {
    get: () => Promise<{ data?: unknown[] | Record<string, unknown> }>;
    set: (data: T) => Promise<unknown>;
  };
  get?: () => Promise<{ data?: unknown[] }>;
  where: (query: Record<string, unknown>) => {
    orderBy?: (field: string, direction: "asc" | "desc") => {
      skip?: (offset: number) => {
        limit?: (limit: number) => {
          get: () => Promise<{ data?: unknown[] }>;
        };
        get: () => Promise<{ data?: unknown[] }>;
      };
      limit?: (limit: number) => {
        get: () => Promise<{ data?: unknown[] }>;
      };
      get: () => Promise<{ data?: unknown[] }>;
    };
    skip?: (offset: number) => {
      limit?: (limit: number) => {
        get: () => Promise<{ data?: unknown[] }>;
      };
      get: () => Promise<{ data?: unknown[] }>;
    };
    limit?: (limit: number) => {
      get: () => Promise<{ data?: unknown[] }>;
    };
    get: () => Promise<{ data?: unknown[] }>;
  };
};

function firstDocument(result: { data?: unknown }) {
  const data = result.data;
  if (Array.isArray(data)) return data[0];
  return data && typeof data === "object" ? data : undefined;
}

type ConversationDependencies = {
  conversationsCollection: DocumentCollection<ConversationDocument>;
  messagesCollection: DocumentCollection<ConversationMessageDocument>;
  parentNeedsCollection: DocumentCollection<SourceDocument>;
  tutorProfilesCollection: DocumentCollection<SourceDocument>;
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

function createConversationUniqKey({
  participants,
  sourceId,
  sourceType
}: {
  participants: string[];
  sourceId: string;
  sourceType: ServerConversationSourceType;
}) {
  return `${sourceType}:${sourceId}:${participants.join(":")}`;
}

function createSourceKey({
  sourceId,
  sourceType
}: {
  sourceId: string;
  sourceType: ServerConversationSourceType;
}) {
  return `${sourceType}:${sourceId}`;
}

function createConversationIndexFields({
  participantUserIds,
  sourceId,
  sourceType
}: {
  participantUserIds: string[];
  sourceId: string;
  sourceType: ServerConversationSourceType;
}) {
  const participants = participantUserIds.map(normalizeUserId).filter(Boolean).sort();

  return {
    conversationUniqKey: createConversationUniqKey({
      participants,
      sourceId,
      sourceType
    }),
    participantKeys: participants,
    sourceKey: createSourceKey({ sourceId, sourceType })
  };
}

function createFailure(message: string): Failure {
  return {
    ok: false,
    value: null,
    errors: { request: message }
  };
}

function createAuthFailure() {
  return createFailure("必须登录后才能访问会话");
}

function requireAuthenticatedUser(authenticatedUserId: string) {
  const currentUserId = normalizeUserId(authenticatedUserId);
  return currentUserId || null;
}

function normalizeConversation(
  conversation: ConversationDocument
): (Required<Pick<
  ConversationDocument,
  "createdAt" | "id" | "participantUserIds" | "sourceId" | "sourceType"
>> & Pick<ConversationDocument, "sourceVersion">) | null {
  if (
    !conversation.id ||
    !conversation.createdAt ||
    !conversation.sourceId ||
    !conversation.sourceType ||
    !conversation.participantUserIds?.length
  ) {
    return null;
  }

  return {
    id: conversation.id,
    participantUserIds: conversation.participantUserIds.map(normalizeUserId),
    sourceId: conversation.sourceId,
    sourceType: conversation.sourceType,
    sourceVersion: conversation.sourceVersion,
    createdAt: conversation.createdAt
  };
}

function normalizeMessage(
  message: ConversationMessageDocument
): Required<Pick<ConversationMessageDocument, "conversationId" | "createdAt" | "id" | "senderUserId" | "text">> | null {
  if (
    !message.id ||
    !message.conversationId ||
    !message.senderUserId ||
    !message.createdAt ||
    typeof message.text !== "string"
  ) {
    return null;
  }

  return {
    id: message.id,
    conversationId: message.conversationId,
    senderUserId: message.senderUserId,
    text: message.text,
    createdAt: message.createdAt
  };
}

function isParticipant(conversation: ConversationDocument, userId: string) {
  return conversation.participantUserIds?.includes(normalizeUserId(userId)) ?? false;
}

function toConversationView(
  conversation: Required<Pick<ConversationDocument, "createdAt" | "id" | "sourceId" | "sourceType">>,
  sourceStatus: "deleted" | "published" = "published"
): ServerConversationView {
  return {
    id: conversation.id,
    sourceId: conversation.sourceId,
    sourceType: conversation.sourceType,
    sourceStatus,
    readOnly: sourceStatus === "deleted",
    createdAt: conversation.createdAt
  };
}

function toMessageView(
  message: Required<Pick<ConversationMessageDocument, "conversationId" | "createdAt" | "id" | "senderUserId" | "text">>,
  currentUserId: string
): ServerConversationMessageView {
  return {
    id: message.id,
    conversationId: message.conversationId,
    direction: message.senderUserId === currentUserId ? "sent" : "received",
    text: message.text,
    createdAt: message.createdAt
  };
}

async function readSourceOwnerUserId({
  parentNeedsCollection,
  sourceId,
  sourceType,
  tutorProfilesCollection
}: Pick<ConversationDependencies, "parentNeedsCollection" | "tutorProfilesCollection"> & {
  sourceId: string;
  sourceType: ServerConversationSourceType;
}) {
  const source = await readSourceState({
    parentNeedsCollection,
    sourceId,
    sourceType,
    tutorProfilesCollection
  });

  return source?.status === "published" && source.ownerUserId
    ? normalizeUserId(source.ownerUserId)
    : null;
}

async function readSourceState({
  parentNeedsCollection,
  sourceId,
  sourceType,
  tutorProfilesCollection
}: Pick<ConversationDependencies, "parentNeedsCollection" | "tutorProfilesCollection"> & {
  sourceId: string;
  sourceType: ServerConversationSourceType;
}) {
  const collection =
    sourceType === "parent-need" ? parentNeedsCollection : tutorProfilesCollection;
  const result = await collection.doc(sourceId).get();
  const source = firstDocument(result) as SourceDocument | undefined;

  return source ?? null;
}

async function toConversationViewWithSource(
  conversation: Required<Pick<
    ConversationDocument,
    "createdAt" | "id" | "sourceId" | "sourceType"
  >> & Pick<ConversationDocument, "sourceVersion">,
  dependencies: Pick<
    ConversationDependencies,
    "parentNeedsCollection" | "tutorProfilesCollection"
  >
) {
  const source = await readSourceState({
    ...dependencies,
    sourceId: conversation.sourceId,
    sourceType: conversation.sourceType
  });
  const versionMatches = !Number.isInteger(conversation.sourceVersion) ||
    !Number.isInteger(source?.version) ||
    conversation.sourceVersion === source?.version;
  const sourceStatus = source?.status === "published" && source.managementState !== "legacy-readonly" && versionMatches
    ? "published"
    : "deleted";

  return toConversationView(conversation, sourceStatus);
}

async function getQueryResult(query: ReturnType<ConversationDependencies["conversationsCollection"]["where"]>) {
  const orderedQuery = query.orderBy?.("createdAt", "desc") ?? query;
  const limitedQuery = orderedQuery.limit?.(100) ?? orderedQuery;

  return limitedQuery.get();
}

async function readConversationsByUniqueKey({
  conversationUniqKey,
  conversationsCollection
}: Pick<ConversationDependencies, "conversationsCollection"> & {
  conversationUniqKey: string;
}) {
  const result = await getQueryResult(
    conversationsCollection.where({ conversationUniqKey })
  );

  return (result.data ?? [])
    .map((conversation) => normalizeConversation(conversation as ConversationDocument))
    .filter((conversation): conversation is NonNullable<typeof conversation> =>
      Boolean(conversation)
    );
}

async function readLegacyConversationsBySource({
  conversationsCollection,
  participantUserIds,
  sourceId,
  sourceType
}: Pick<ConversationDependencies, "conversationsCollection"> & {
  participantUserIds: string[];
  sourceId: string;
  sourceType: ServerConversationSourceType;
}) {
  const expectedParticipants = participantUserIds.map(normalizeUserId).filter(Boolean).sort();
  const result = await getQueryResult(conversationsCollection.where({ sourceId }));

  return (result.data ?? [])
    .map((conversation) => conversation as ConversationDocument)
    .filter((conversation) => {
      const normalizedConversation = normalizeConversation(conversation);

      if (!normalizedConversation || normalizedConversation.sourceType !== sourceType) {
        return false;
      }

      const participants = normalizedConversation.participantUserIds
        .map(normalizeUserId)
        .filter(Boolean)
        .sort();

      return participants.join(":") === expectedParticipants.join(":");
    });
}

async function readConversationsByParticipant({
  conversationsCollection,
  participantKey
}: Pick<ConversationDependencies, "conversationsCollection"> & {
  participantKey: string;
}) {
  const result = await getQueryResult(
    conversationsCollection.where({ participantKeys: participantKey })
  );

  return (result.data ?? [])
    .map((conversation) => normalizeConversation(conversation as ConversationDocument))
    .filter((conversation): conversation is NonNullable<typeof conversation> =>
      Boolean(conversation)
    );
}

async function readConversation({
  conversationId,
  conversationsCollection
}: Pick<ConversationDependencies, "conversationsCollection"> & {
  conversationId: string;
}) {
  const result = await conversationsCollection.doc(conversationId).get();
  const conversation = firstDocument(result) as ConversationDocument | undefined;

  return conversation
    ? normalizeConversation({ ...conversation, id: conversationId })
    : null;
}

async function writeBackfilledConversationIndexes({
  conversation,
  conversationsCollection
}: Pick<ConversationDependencies, "conversationsCollection"> & {
  conversation: ConversationDocument;
}) {
  const normalizedConversation = normalizeConversation(conversation);

  if (!normalizedConversation) {
    return false;
  }

  const indexFields = createConversationIndexFields({
    participantUserIds: normalizedConversation.participantUserIds,
    sourceId: normalizedConversation.sourceId,
    sourceType: normalizedConversation.sourceType
  });

  if (
    conversation.conversationUniqKey === indexFields.conversationUniqKey &&
    conversation.sourceKey === indexFields.sourceKey &&
    conversation.participantKeys?.join(":") === indexFields.participantKeys.join(":")
  ) {
    return false;
  }

  await conversationsCollection.doc(normalizedConversation.id).set({
    ...conversation,
    ...indexFields,
    id: normalizedConversation.id,
    participantUserIds: normalizedConversation.participantUserIds,
    sourceId: normalizedConversation.sourceId,
    sourceType: normalizedConversation.sourceType,
    createdAt: normalizedConversation.createdAt
  });

  return true;
}

export async function backfillServerConversationIndexes({
  conversationsCollection
}: Pick<ConversationDependencies, "conversationsCollection">) {
  const result = await conversationsCollection.get?.();
  const conversations = result?.data ?? [];
  let updated = 0;

  for (const conversation of conversations) {
    const wasUpdated = await writeBackfilledConversationIndexes({
      conversation: conversation as ConversationDocument,
      conversationsCollection
    });

    if (wasUpdated) {
      updated += 1;
    }
  }

  return {
    scanned: conversations.length,
    updated
  };
}

export async function createOrReadServerConversationFromSource({
  authenticatedUserId,
  conversationsCollection,
  now = new Date().toISOString(),
  parentNeedsCollection,
  preallocatedId,
  sourceId,
  sourceType,
  tutorProfilesCollection
}: ConversationDependencies & {
  authenticatedUserId: string;
  now?: string;
  preallocatedId?: string;
  sourceId: string;
  sourceType: ServerConversationSourceType;
}): Promise<Success<ServerConversationView> | Failure> {
  const currentUserId = requireAuthenticatedUser(authenticatedUserId);

  if (!currentUserId) {
    return createAuthFailure();
  }

  const ownerUserId = await readSourceOwnerUserId({
    parentNeedsCollection,
    sourceId,
    sourceType,
    tutorProfilesCollection
  });

  if (!ownerUserId) {
    return createFailure("无法找到会话来源");
  }

  if (ownerUserId === currentUserId) {
    return createFailure("不能和自己发布的信息创建会话");
  }

  const participants = [currentUserId, ownerUserId].sort();
  const conversationUniqKey = createConversationUniqKey({
    participants,
    sourceId,
    sourceType
  });
  const requestedId = resolveDocumentId(preallocatedId, "conversation");
  if (!requestedId) {
    return createFailure("会话标识无效");
  }
  if (preallocatedId !== undefined) {
    const exactDocument = firstDocument(
      await conversationsCollection.doc(requestedId).get()
    ) as
      | ConversationDocument
      | undefined;
    const exact = exactDocument ? normalizeConversation(exactDocument) : null;
    if (exact) {
      return exact.sourceId === sourceId &&
        exact.sourceType === sourceType &&
        exact.participantUserIds.join(":") === participants.join(":")
        ? { ok: true, value: toConversationView(exact), errors: {} }
        : createFailure("会话标识已被占用");
    }
  }
  const existingConversation = (await readConversationsByUniqueKey({
    conversationUniqKey,
    conversationsCollection
  }))[0] ?? (await readLegacyConversationsBySource({
    conversationsCollection,
    participantUserIds: participants,
    sourceId,
    sourceType
  }))[0];

  const normalizedExistingConversation = existingConversation
    ? normalizeConversation(existingConversation)
    : null;

  if (normalizedExistingConversation) {
    await writeBackfilledConversationIndexes({
      conversation: existingConversation,
      conversationsCollection
    });

    return {
      ok: true,
      value: toConversationView(normalizedExistingConversation),
      errors: {}
    };
  }

  const conversation = {
    conversationUniqKey,
    id: requestedId,
    participantKeys: participants,
    participantUserIds: participants,
    sourceId,
    sourceKey: createSourceKey({ sourceId, sourceType }),
    sourceType,
    createdAt: now
  };

  await conversationsCollection.doc(conversation.id).set(conversation);

  return {
    ok: true,
    value: toConversationView(conversation),
    errors: {}
  };
}

export async function readServerConversationForUser({
  authenticatedUserId,
  conversationId,
  conversationsCollection,
  parentNeedsCollection,
  tutorProfilesCollection
}: ConversationDependencies & {
  authenticatedUserId: string;
  conversationId: string;
}): Promise<Success<ServerConversationView | null> | Failure> {
  const currentUserId = requireAuthenticatedUser(authenticatedUserId);

  if (!currentUserId) {
    return createAuthFailure();
  }

  const conversation = await readConversation({ conversationId, conversationsCollection });

  const value = conversation && isParticipant(conversation, currentUserId)
    ? await toConversationViewWithSource(conversation, {
        parentNeedsCollection,
        tutorProfilesCollection
      })
    : null;

  return { ok: true, value, errors: {} };
}

export async function listServerConversationsForUser({
  authenticatedUserId,
  conversationsCollection,
  parentNeedsCollection,
  tutorProfilesCollection
}: ConversationDependencies & {
  authenticatedUserId: string;
}): Promise<Success<ServerConversationView[]> | Failure> {
  const currentUserId = requireAuthenticatedUser(authenticatedUserId);

  if (!currentUserId) {
    return createAuthFailure();
  }

  const conversations = (await readConversationsByParticipant({
    conversationsCollection,
    participantKey: currentUserId
  }))
    .filter((conversation) => isParticipant(conversation, currentUserId))
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    );
  const views = await Promise.all(
    conversations.map((conversation) =>
      toConversationViewWithSource(conversation, {
        parentNeedsCollection,
        tutorProfilesCollection
      })
    )
  );

  return {
    ok: true,
    value: views,
    errors: {}
  };
}

export async function sendServerConversationMessage({
  authenticatedUserId,
  conversationId,
  conversationsCollection,
  messagesCollection,
  now = new Date().toISOString(),
  parentNeedsCollection,
  preallocatedId,
  text,
  tutorProfilesCollection
}: ConversationDependencies & {
  authenticatedUserId: string;
  conversationId: string;
  now?: string;
  preallocatedId?: string;
  text: string;
}): Promise<Success<ServerConversationMessageView> | Failure> {
  const currentUserId = requireAuthenticatedUser(authenticatedUserId);

  if (!currentUserId) {
    return createAuthFailure();
  }

  const conversation = await readConversation({ conversationId, conversationsCollection });

  if (!conversation || !isParticipant(conversation, currentUserId)) {
    return createFailure("只有会话参与者可以发送消息");
  }

  const source = await readSourceState({
    parentNeedsCollection,
    sourceId: conversation.sourceId,
    sourceType: conversation.sourceType,
    tutorProfilesCollection
  });

  const sourceVersionMatches = !Number.isInteger(conversation.sourceVersion) ||
    !Number.isInteger(source?.version) ||
    conversation.sourceVersion === source?.version;

  if (source?.status !== "published" || source.managementState === "legacy-readonly" || !sourceVersionMatches) {
    return createFailure("关联发布已删除，会话当前只读");
  }

  const normalizedText = text.trim();

  if (!normalizedText) {
    return createFailure("消息内容不能为空");
  }

  const requestedId = resolveDocumentId(preallocatedId, "message");
  if (!requestedId) {
    return createFailure("消息标识无效");
  }
  if (preallocatedId !== undefined) {
    const existing = firstDocument(await messagesCollection.doc(requestedId).get()) as
      | ConversationMessageDocument
      | undefined;
    if (existing) {
      const normalizedExisting = normalizeMessage({ ...existing, id: requestedId });
      return normalizedExisting &&
        existing.conversationId === conversationId &&
        existing.senderUserId === currentUserId &&
        existing.text === normalizedText
        ? { ok: true, value: toMessageView(normalizedExisting, currentUserId), errors: {} }
        : createFailure("消息标识已被占用");
    }
  }

  const message = {
    id: requestedId,
    conversationId,
    senderUserId: currentUserId,
    text: normalizedText,
    createdAt: now
  };

  await messagesCollection.doc(message.id).set(message);

  return {
    ok: true,
    value: toMessageView(message, currentUserId),
    errors: {}
  };
}

export async function listServerConversationMessages({
  authenticatedUserId,
  conversationId,
  conversationsCollection,
  messagesCollection
}: ConversationDependencies & {
  authenticatedUserId: string;
  conversationId: string;
}): Promise<Success<ServerConversationMessageView[]> | Failure> {
  const currentUserId = requireAuthenticatedUser(authenticatedUserId);

  if (!currentUserId) {
    return createAuthFailure();
  }

  const conversation = await readConversation({ conversationId, conversationsCollection });

  if (!conversation || !isParticipant(conversation, currentUserId)) {
    return {
      ok: true,
      value: [],
      errors: {}
    };
  }

  const result = await messagesCollection.where({ conversationId }).get();
  const messages = (result.data ?? [])
    .map((message) => normalizeMessage(message as ConversationMessageDocument))
    .filter((message): message is NonNullable<typeof message> => Boolean(message))
    .sort(
      (left, right) =>
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    )
    .map((message) => toMessageView(message, currentUserId));

  return {
    ok: true,
    value: messages,
    errors: {}
  };
}
