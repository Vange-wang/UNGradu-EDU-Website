"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

import {
  CustomerServiceReply,
  getTutorCustomerServiceReply
} from "@/features/customer-service/tutor-customer-service-agent";

type ChatMessage = {
  id: number;
  role: "assistant" | "user";
  text: string;
  intent?: CustomerServiceReply["intent"];
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
    id: 1,
    role: "assistant",
    text: "你好，我是 UNGradu EDU 智能客服助手。你可以问找家教、发布资料、联系方式交换、课时费边界和风险反馈。"
  }
];

export function CustomerServiceChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const messagesRef = useRef<HTMLDivElement>(null);
  const isPristine = messages.length === 1;

  useEffect(() => {
    const messageList = messagesRef.current;
    if (!messageList || isPristine) {
      return;
    }

    messageList.scrollTop = messageList.scrollHeight;
  }, [isPristine, messages]);

  function ask(question: string) {
    const normalized = question.trim();
    if (!normalized) {
      return;
    }

    const reply = getTutorCustomerServiceReply(normalized);
    setMessages((current) => [
      ...current,
      {
        id: current.length + 1,
        role: "user",
        text: normalized
      },
      {
        id: current.length + 2,
        role: "assistant",
        text: reply.answer,
        intent: reply.intent
      }
    ]);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    ask(input);
    setInput("");
  }

  return (
    <section
      aria-label="站内智能客服对话"
      className="customer-service-chat"
      data-chat-state={isPristine ? "pristine" : "active"}
    >
      <div className="customer-service-messages" ref={messagesRef}>
        {messages.map((message) => (
          <div
            className={
              [
                "customer-service-message",
                message.id === 1 ? "customer-service-message-initial" : "",
                message.role === "user" ? "customer-service-message-user" : ""
              ]
                .filter(Boolean)
                .join(" ")
            }
            key={message.id}
          >
            <p>{message.text}</p>
            {message.intent === "risk_handoff" || message.intent === "fallback" ? (
              <a className="customer-service-inline-link" href="/feedback">
                去提交风险与功能反馈
              </a>
            ) : null}
          </div>
        ))}
      </div>

      <div className="customer-service-quick-list" aria-label="快捷问题">
        {quickQuestions.map((question) => (
          <button key={question} onClick={() => ask(question)} type="button">
            {question}
          </button>
        ))}
      </div>

      <form
        className="customer-service-compose"
        data-has-input={input.length > 0 ? "true" : "false"}
        onSubmit={submit}
      >
        <label className="sr-only" htmlFor="customer-service-question">
          输入客服问题
        </label>
        <input
          id="customer-service-question"
          onChange={(event) => setInput(event.target.value)}
          placeholder="输入问题，例如：怎么联系老师？"
          type="text"
          value={input}
        />
        <button className="button primary" type="submit">
          发送
        </button>
      </form>
    </section>
  );
}
