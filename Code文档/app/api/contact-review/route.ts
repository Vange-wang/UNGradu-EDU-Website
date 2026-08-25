import { createRuntimeEnvWithSessionRevocation } from "@/server/api-utils";
import { createCloudBaseServerApp } from "@/server/cloudbase-server";
import { createContactReviewApiHandlers } from "@/server/contact-review-api";
import type { CloudBaseContactReviewDatabase } from "@/server/security/contact-review-cloudbase";
import { createContactReviewRuntime } from "@/server/security/contact-review-runtime";

type Handlers = ReturnType<typeof createContactReviewApiHandlers>;
let handlers: Handlers | undefined;

function getHandlers() {
  if (!handlers) {
    const database = createCloudBaseServerApp().database();
    const env = createRuntimeEnvWithSessionRevocation(database);
    const runtime = createContactReviewRuntime({
      database: database as unknown as CloudBaseContactReviewDatabase,
      entityType: "parent_need",
      env
    });
    handlers = createContactReviewApiHandlers({ env, gate: runtime.gate, service: runtime.service });
  }
  return handlers;
}

export const GET: Handlers["GET_STATUS"] = (...args) => getHandlers().GET_STATUS(...args);
export const POST: Handlers["POST_ACTION"] = (...args) => getHandlers().POST_ACTION(...args);
