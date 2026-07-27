"use client";

import { FormEvent, useState } from "react";

import {
  buildCustomerServiceHistory,
  sendCustomerServiceMessage
} from "@/features/customer-service/customer-service-api-client";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  intent?: string;
};

const quickQuestions = [
  "家长怎么发布找老师需求？",
  "大学生怎么发布家教资料？",
  "什么时候能交换联系方式？",
  "平台怎么处理投诉或虚假信息？",
  "课时费和付款怎么处理？"
];

const initialMessages: ChatMessage[] = [
  {
    id: "assistant-initial",
    role: "assistant",
    text: "你好，我是 UNGradu EDU 智能客服助手。你可以问找家教、发布资料、联系方式交换、课时费边界和风险反馈。"
  }
];

export function CustomerServiceChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  async function ask(question: string) {
    const normalized = question.trim();
    if (!normalized) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: normalized
    };

    setMessages((current) => [...current, userMessage]);
    setSubmitting(true);

    try {
      const result = await sendCustomerServiceMessage({
        conversationId,
        history: buildCustomerServiceHistory(messages),
        text: normalized
      });

      setConversationId(result.value.conversationId);
      setMessages((current) => [
        ...current,
        {
          id: result.value.messageId,
          intent: result.value.answer.templateId ?? result.value.answer.source,
          role: "assistant",
          text: result.value.answer.text
        }
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          intent: "terminal_guard",
          role: "assistant",
          text: "抱歉，当前无法处理您的请求，请稍后再试。"
        }
      ]);
    } finally {
      setSubmitting(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await ask(input);
    setInput("");
  }

  return (
    <section className="customer-service-chat" aria-label="站内智能客服对话">
      <div className="customer-service-messages">
        {messages.map((message) => (
          <div
            className={
              message.role === "user"
                ? "customer-service-message customer-service-message-user"
                : "customer-service-message"
            }
            key={message.id}
          >
            <p>{message.text}</p>
            {message.intent === "HANDOFF_REQUIRED" ||
            message.intent === "HANDOFF_LOCKED_STATUS" ||
            message.intent === "UNABLE_TO_CONFIRM" ||
            message.intent === "terminal_guard" ? (
              <a className="customer-service-inline-link" href="/feedback">
                去提交风险与功能反馈
              </a>
            ) : null}
          </div>
        ))}
      </div>

      <div className="customer-service-quick-list" aria-label="快捷问题">
        {quickQuestions.map((question) => (
          <button
            disabled={submitting}
            key={question}
            onClick={() => void ask(question)}
            type="button"
          >
            {question}
          </button>
        ))}
      </div>

      <form className="customer-service-compose" onSubmit={submit}>
        <label className="sr-only" htmlFor="customer-service-question">
          输入客服问题
        </label>
        <input
          disabled={submitting}
          id="customer-service-question"
          onChange={(event) => setInput(event.target.value)}
          placeholder="输入问题，例如：怎么联系老师？"
          type="text"
          value={input}
        />
        <button className="button primary" disabled={submitting} type="submit">
          {submitting ? "发送中" : "发送"}
        </button>
      </form>
    </section>
  );
}
