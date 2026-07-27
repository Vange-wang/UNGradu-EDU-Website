export type CustomerServiceApiResponse = {
  ok: true;
  value: {
    answer: {
      handoffRequired: boolean;
      source: "knowledge" | "fallback" | "template" | "terminal_guard";
      templateId?: string;
      text: string;
      type: "direct" | "clarify" | "guidance" | "handoff_suggestion";
      uncertainty: "bounded" | "uncertain";
    };
    audit: {
      finalAction: string;
      kbStatus: string;
      runtimeConfigStatus: "ready" | "missing";
    };
    citations: Array<{
      chunkId: string;
      score: number;
      snippet: string;
      title: string;
    }>;
    conversationId: string;
    messageId: string;
    runtime: {
      configStatus: "ready" | "missing";
      mode: "local_mvp" | "dify";
    };
  };
};

export function buildCustomerServiceHistory(
  messages: Array<{ role: "user" | "assistant"; text: string }>
) {
  const recent = messages.slice(-12);
  const history: typeof recent = [];
  let remainingCharacters = 4000;

  for (let index = recent.length - 1; index >= 0; index -= 1) {
    const message = recent[index];
    if (message.text.length > remainingCharacters) {
      if (remainingCharacters > 0) {
        history.unshift({
          ...message,
          text: message.text.slice(-remainingCharacters)
        });
      }
      break;
    }
    history.unshift(message);
    remainingCharacters -= message.text.length;
  }

  return history;
}

export async function sendCustomerServiceMessage(input: {
  conversationId?: string;
  history?: Array<{ role: "user" | "assistant"; text: string }>;
  messageId?: string;
  text: string;
}) {
  const response = await fetch("/api/customer-service", {
    body: JSON.stringify({
      conversationId: input.conversationId,
      history: input.history ?? [],
      messageId: input.messageId,
      pageContext: {
        entry: "customer-service-page",
        page: "/customer-service"
      },
      text: input.text
    }),
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  });

  if (!response.ok) {
    throw new Error(`Customer service request failed with status ${response.status}`);
  }

  return (await response.json()) as CustomerServiceApiResponse;
}
