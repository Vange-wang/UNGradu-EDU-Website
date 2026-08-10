import { createCloudBaseServerApp } from "@/server/cloudbase-server";
import { RISK_FEEDBACK_COLLECTION } from "@/server/risk-feedback";
import { createRiskFeedbackApiHandlers } from "@/server/risk-feedback-api";
import { createRuntimeEnvWithSessionRevocation } from "@/server/api-utils";

function createHandlers() {
  const database = createCloudBaseServerApp().database();
  const env = createRuntimeEnvWithSessionRevocation(database);
  return createRiskFeedbackApiHandlers({
    collection: database.collection(RISK_FEEDBACK_COLLECTION),
    env
  });
}

export async function POST(request: Request) {
  return createHandlers().POST(request);
}

export async function GET(request: Request) {
  return createHandlers().GET(request);
}
