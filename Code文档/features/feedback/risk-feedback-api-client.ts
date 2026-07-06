import { parseApiResponse } from "@/features/api/api-client";
import type { RiskFeedbackInput } from "@/features/feedback/risk-feedback";
import type { ServerRiskFeedback } from "@/server/risk-feedback";

export async function submitRiskFeedbackToApi({
  fetcher = fetch,
  input
}: {
  fetcher?: typeof fetch;
  input: RiskFeedbackInput;
}) {
  const response = await fetcher("/api/feedback", {
    body: JSON.stringify(input),
    credentials: "same-origin",
    headers: {
      "content-type": "application/json"
    },
    method: "POST"
  });

  return parseApiResponse<ServerRiskFeedback>(response);
}
