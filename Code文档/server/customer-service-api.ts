import { apiError, jsonResponse, readJsonBody } from "@/server/api-utils";
import { createConfiguredCustomerServiceOrchestrator } from "@/server/customer-service";

export function createCustomerServiceApiHandlers(env = process.env) {
  const orchestrator = createConfiguredCustomerServiceOrchestrator({
    env,
    rootDir: process.cwd()
  });

  return {
    async POST(request: Request) {
      const body = await readJsonBody<{
        conversationId?: string;
        history?: Array<{ role: "user" | "assistant"; text: string }>;
        messageId?: string;
        pageContext?: { entry?: string; page?: string };
        text?: string;
      }>(request);

      if (!body.ok) {
        return body.response;
      }

      if (!body.value.text?.trim()) {
        return apiError(400, "客服消息不能为空。");
      }

      const result = await orchestrator.handleMessage({
        conversationId: body.value.conversationId,
        history: body.value.history,
        messageId: body.value.messageId,
        pageContext: {
          entry: body.value.pageContext?.entry?.trim() || "customer-service-page",
          page: body.value.pageContext?.page?.trim() || "/customer-service"
        },
        text: body.value.text
      });

      return jsonResponse(result, 200);
    }
  };
}
