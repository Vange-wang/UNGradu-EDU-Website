import { createCloudBaseServerApp } from "@/server/cloudbase-server";
import { RISK_FEEDBACK_COLLECTION } from "@/server/risk-feedback";
import { createRiskFeedbackApiHandlers } from "@/server/risk-feedback-api";

function createHandlers() {
  return createRiskFeedbackApiHandlers({
    collection: createCloudBaseServerApp()
      .database()
      .collection(RISK_FEEDBACK_COLLECTION)
  });
}

export async function POST(request: Request) {
  return createHandlers().POST(request);
}
