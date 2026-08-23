import {
  createCloudBaseContactReviewRepository,
  readContactReviewRuntimeGate,
  type CloudBaseContactReviewDatabase
} from "./contact-review-cloudbase";
import { createContactReviewManagementIntegration } from "./contact-review-integration";
import { createContactReviewService, type ContactReviewEntityType } from "./contact-review-production";

export function createContactReviewRuntime({
  database,
  entityType,
  env
}: {
  database: CloudBaseContactReviewDatabase;
  entityType: ContactReviewEntityType;
  env: Record<string, unknown>;
}) {
  const gate = readContactReviewRuntimeGate(env);
  if (!gate.ok || !gate.enabled) return { gate };
  const repository = createCloudBaseContactReviewRepository({ database });
  const service = createContactReviewService({
    idFactory: (prefix) => `${prefix}-${crypto.randomUUID()}`,
    keySecret: typeof env.CONTACT_REVIEW_KEY_SECRET === "string" ? env.CONTACT_REVIEW_KEY_SECRET : "",
    repository
  });
  return {
    gate,
    integration: createContactReviewManagementIntegration({ entityType, service }),
    service
  };
}
