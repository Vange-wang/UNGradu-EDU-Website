import { fetchWithCsrf, parseApiResponse } from "@/features/api/api-client";
import type { RiskFeedbackInput } from "@/features/feedback/risk-feedback";
import type {
  PublicRiskFeedbackRecord,
  ServerRiskFeedback
} from "@/server/risk-feedback";

export async function submitRiskFeedbackToApi({
  fetcher = fetch,
  input
}: {
  fetcher?: typeof fetch;
  input: RiskFeedbackInput;
}) {
  const response = await fetchWithCsrf(fetcher, "/api/feedback", {
    body: JSON.stringify(input),
    credentials: "same-origin",
    headers: {
      "content-type": "application/json"
    },
    method: "POST"
  }, { allowAnonymous: true });

  return parseApiResponse<ServerRiskFeedback>(response);
}

export async function listMyRiskFeedbackFromApi({
  fetcher = fetch
}: {
  fetcher?: typeof fetch;
} = {}) {
  const response = await fetcher("/api/feedback", {
    credentials: "same-origin",
    method: "GET"
  });

  return parseApiResponse<PublicRiskFeedbackRecord[]>(response);
}
