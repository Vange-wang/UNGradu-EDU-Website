export const CONVERSATIONS_COLLECTION = "conversations";
export const CONVERSATION_MESSAGES_COLLECTION = "messages";

export type ServerConversationSourceType = "parent-need" | "tutor-profile";

export type ServerConversationView = {
  id: string;
  sourceId: string;
  sourceType: ServerConversationSourceType;
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
  ownerUserId?: string;
  status?: string;
};

type ConversationDocument = {
  id?: string;
  participantUserIds?: string[];
  sourceId?: string;
  sourceType?: ServerConversationSourceType;
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
    get: () => Promise<{ data?: unknown[] }>;
    set: (data: T) => Promise<unknown>;
  };
  where: (query: Record<string, unknown>) => {
    get: () => Promise<{ data?: unknown[] }>;
  };
};

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
): Required<Pick<ConversationDocument, "createdAt" | "id" | "participantUserIds" | "sourceId" | "sourceType">> | null {
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
  conversation: Required<Pick<ConversationDocument, "createdAt" | "id" | "sourceId" | "sourceType">>
): ServerConversationView {
  return {
    id: conversation.id,
    sourceId: conversation.sourceId,
    sourceType: conversation.sourceType,
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
  const collection =
    sourceType === "parent-need" ? parentNeedsCollection : tutorProfilesCollection;
  const result = await collection.doc(sourceId).get();
  const source = result.data?.[0] as SourceDocument | undefined;

  return source?.status === "published" && source.ownerUserId
    ? normalizeUserId(source.ownerUserId)
    : null;
}

async function readAllConversations(conversationsCollection: ConversationDependencies["conversationsCollection"]) {
  const result = await conversationsCollection.where({}).get();

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
  const conversation = result.data?.[0] as ConversationDocument | undefined;

  return conversation
    ? normalizeConversation({ ...conversation, id: conversationId })
    : null;
}

export async function createOrReadServerConversationFromSource({
  authenticatedUserId,
  conversationsCollection,
  now = new Date().toISOString(),
  parentNeedsCollection,
  sourceId,
  sourceType,
  tutorProfilesCollection
}: ConversationDependencies & {
  authenticatedUserId: string;
  now?: string;
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
  const existingConversation = (await readAllConversations(conversationsCollection))
    .find((conversation) =>
      conversation.sourceId === sourceId &&
      conversation.sourceType === sourceType &&
      conversation.participantUserIds.every((participantUserId) =>
        participants.includes(participantUserId)
      )
    );

  if (existingConversation) {
    return {
      ok: true,
      value: toConversationView(existingConversation),
      errors: {}
    };
  }

  const conversation = {
    id: createOpaqueId("conversation"),
    participantUserIds: participants,
    sourceId,
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
  conversationsCollection
}: ConversationDependencies & {
  authenticatedUserId: string;
  conversationId: string;
}): Promise<Success<ServerConversationView | null> | Failure> {
  const currentUserId = requireAuthenticatedUser(authenticatedUserId);

  if (!currentUserId) {
    return createAuthFailure();
  }

  const conversation = await readConversation({ conversationId, conversationsCollection });

  return {
    ok: true,
    value: conversation && isParticipant(conversation, currentUserId)
      ? toConversationView(conversation)
      : null,
    errors: {}
  };
}

export async function listServerConversationsForUser({
  authenticatedUserId,
  conversationsCollection
}: ConversationDependencies & {
  authenticatedUserId: string;
}): Promise<Success<ServerConversationView[]> | Failure> {
  const currentUserId = requireAuthenticatedUser(authenticatedUserId);

  if (!currentUserId) {
    return createAuthFailure();
  }

  const conversations = (await readAllConversations(conversationsCollection))
    .filter((conversation) => isParticipant(conversation, currentUserId))
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    )
    .map(toConversationView);

  return {
    ok: true,
    value: conversations,
    errors: {}
  };
}

export async function sendServerConversationMessage({
  authenticatedUserId,
  conversationId,
  conversationsCollection,
  messagesCollection,
  now = new Date().toISOString(),
  text
}: ConversationDependencies & {
  authenticatedUserId: string;
  conversationId: string;
  now?: string;
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

  const normalizedText = text.trim();

  if (!normalizedText) {
    return createFailure("消息内容不能为空");
  }

  const message = {
    id: createOpaqueId("message"),
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
