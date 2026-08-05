"use client";

import React, { type FormEvent, useEffect, useRef } from "react";

import type { ServerConversationMessageView } from "@/server/conversations";

type ChatMessagePanelProps = {
  authorizedProfiles: boolean;
  messages: ServerConversationMessageView[];
  messageText: string;
  readOnly: boolean;
  onMessageTextChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

type MessageListScrollTarget = {
  scrollHeight: number;
  scrollTop: number;
};

export function scrollMessageListToLatest(messageList: MessageListScrollTarget) {
  messageList.scrollTop = messageList.scrollHeight;
}

export function ChatMessagePanel({
  authorizedProfiles,
  messages,
  messageText,
  onMessageTextChange,
  onSubmit,
  readOnly
}: ChatMessagePanelProps) {
  const messageListRef = useRef<HTMLDivElement>(null);
  const latestMessageId = messages.at(-1)?.id;

  useEffect(() => {
    if (messageListRef.current) {
      scrollMessageListToLatest(messageListRef.current);
    }
  }, [latestMessageId]);

  return (
    <section className="chat-main conversation-main" aria-label="聊天消息">
      <div className="conversation-main-header">
        <div>
          <h2>消息区</h2>
          <p>不直接发送手机号、微信号或详细地址。</p>
        </div>
        <span className="status-pill">
          {authorizedProfiles ? "联系方式已授权" : "联系方式未授权"}
        </span>
      </div>

      <div
        aria-label="聊天记录，可上下滚动查看历史消息"
        className="message-list"
        ref={messageListRef}
        tabIndex={0}
      >
        {messages.length === 0 ? (
          <p className="empty-state">暂无消息，先发一句问候吧。</p>
        ) : null}

        {messages.map((message) => {
          const isOwn = message.direction === "sent";

          return (
            <article
              className={`message-bubble ${isOwn ? "own-message" : ""}`}
              key={message.id}
            >
              <p>{message.text}</p>
              <span>{new Date(message.createdAt).toLocaleString("zh-CN")}</span>
            </article>
          );
        })}
      </div>

      {readOnly ? (
        <p className="privacy-note" role="status">
          关联发布已删除；历史消息仍可查看，但当前会话不可发送新消息。
        </p>
      ) : null}

      <form className="chat-compose" onSubmit={onSubmit}>
        <label className="field" htmlFor="message-text">
          <span>发送文字消息</span>
          <textarea
            id="message-text"
            disabled={readOnly}
            onChange={(event) => onMessageTextChange(event.target.value)}
            placeholder="输入沟通内容，不直接发送联系方式"
            rows={3}
            value={messageText}
          />
        </label>
        <button className="button primary" disabled={readOnly} type="submit">
          发送
        </button>
      </form>
    </section>
  );
}
