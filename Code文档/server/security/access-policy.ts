export type ScopedAccessResult =
  | { ok: true; contactVisible: boolean }
  | {
      ok: false;
      reason:
        | "contact-not-authorized"
        | "owner-mismatch"
        | "participant-mismatch"
        | "source-unavailable"
        | "source-version-mismatch";
    };

export function evaluateScopedAccess({
  actorId,
  contactAuthorized,
  ownerId,
  participantIds,
  requestState,
  sourceStatus,
  sourceVersion,
  conversationSourceVersion
}: {
  actorId: string;
  contactAuthorized: boolean;
  ownerId: string;
  sourceStatus: "deleted" | "published";
  participantIds?: string[];
  requestState?: "approved" | "pending" | "rejected" | "withdrawn" | string;
  sourceVersion?: number;
  conversationSourceVersion?: number;
}): ScopedAccessResult {
  if (sourceStatus !== "published") {
    return { ok: false, reason: "source-unavailable" };
  }

  if (
    sourceVersion !== undefined &&
    conversationSourceVersion !== undefined &&
    sourceVersion !== conversationSourceVersion
  ) {
    return { ok: false, reason: "source-version-mismatch" };
  }

  const participants = participantIds?.map((value) => value.trim()).filter(Boolean) ?? [ownerId.trim()];
  if (!actorId.trim() || !participants.includes(actorId.trim())) {
    return { ok: false, reason: participants.length > 1 ? "participant-mismatch" : "owner-mismatch" };
  }

  if (requestState !== undefined && requestState !== "approved") {
    return { ok: false, reason: "contact-not-authorized" };
  }

  if (!contactAuthorized) {
    return { ok: false, reason: "contact-not-authorized" };
  }

  return { ok: true, contactVisible: true };
}
