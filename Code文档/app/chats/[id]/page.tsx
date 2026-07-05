"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";

import { RequireTestSession } from "@/features/auth/require-test-session";
import {
  approveContactExchangeRequestFromApi,
  createContactExchangeRequestFromApi,
  listContactExchangeRequestsFromApi,
  readAuthorizedContactProfilesFromApi,
  readConversationFromApi,
  readConversationMessagesFromApi,
  rejectContactExchangeRequestFromApi,
  sendConversationMessageToApi,
  withdrawContactExchangeRequestFromApi
} from "@/features/chat/chat-api-client";
import { CHAT_POLLING_INTERVAL_MS } from "@/features/chat/chat-polling";
import type { ContactProfileInput } from "@/features/profile/contact-profile";
import type { ServerContactExchangeRequestView } from "@/server/contact-exchange";
import type {
  ServerConversationMessageView,
  ServerConversationView
} from "@/server/conversations";

const statusLabels: Record<ServerContactExchangeRequestView["status"], string> = {
  approved: "已同意",
  expired: "已过期",
  pending: "待处理",
  rejected: "已拒绝",
  withdrawn: "已撤回"
};

type AuthorizedProfiles = {
  currentUser: ContactProfileInput;
  otherUser: ContactProfileInput;
} | null;

function ChatRoom({ currentUserPhone }: { currentUserPhone: string }) {
  const params = useParams<{ id: string }>();
  const [conversation, setConversation] = useState<ServerConversationView | null>(null);
  const [messages, setMessages] = useState<ServerConversationMessageView[]>([]);
  const [requests, setRequests] = useState<ServerContactExchangeRequestView[]>([]);
  const [authorizedProfiles, setAuthorizedProfiles] =
    useState<AuthorizedProfiles>(null);
  const [messageText, setMessageText] = useState("");
  const [notice, setNotice] = useState("");
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const conversationResult = await readConversationFromApi({
      conversationId: params.id,
      currentUserPhone
    });
    const currentConversation = conversationResult.ok ? conversationResult.value : null;

    setConversation(currentConversation);

    if (!currentConversation) {
      setMessages([]);
      setRequests([]);
      setAuthorizedProfiles(null);
      setLoaded(true);
      return;
    }

    const [messagesResult, requestsResult, authorizedProfilesResult] =
      await Promise.all([
        readConversationMessagesFromApi({
          conversationId: currentConversation.id,
          currentUserPhone
        }),
        listContactExchangeRequestsFromApi({
          conversationId: currentConversation.id,
          currentUserPhone
        }),
        readAuthorizedContactProfilesFromApi({
          conversationId: currentConversation.id,
          currentUserPhone
        })
      ]);

    setMessages(messagesResult.ok ? messagesResult.value : []);
    setRequests(requestsResult.ok ? requestsResult.value : []);
    setAuthorizedProfiles(
      authorizedProfilesResult.ok ? authorizedProfilesResult.value : null
    );
    setLoaded(true);
  }, [currentUserPhone, params.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void refresh();
    }, CHAT_POLLING_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [refresh]);

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");

    if (!conversation) {
      return;
    }

    const result = await sendConversationMessageToApi({
      conversationId: conversation.id,
      currentUserPhone,
      text: messageText
    });

    if (!result.ok) {
      setNotice(result.errors.request ?? "消息发送失败");
      return;
    }

    setMessageText("");
    await refresh();
  }

  async function handleCreateExchangeRequest() {
    setNotice("");

    if (!conversation) {
      return;
    }

    const result = await createContactExchangeRequestFromApi({
      conversationId: conversation.id,
      currentUserPhone
    });

    setNotice(result.ok ? "已发送联系方式交换请求。" : result.errors.request ?? "请求失败");
    await refresh();
  }

  async function handleApproveRequest(requestId: string) {
    setNotice("");

    const confirmed = window.confirm(
      "二次确认：同意后双方将在本会话中看到彼此存档联系方式。是否继续？"
    );

    const result = await approveContactExchangeRequestFromApi({
      currentUserPhone,
      requestId,
      secondConfirmation: confirmed
    });

    setNotice(result.ok ? "已同意交换联系方式。" : result.errors.request ?? "处理失败");
    await refresh();
  }

  async function handleRejectRequest(requestId: string) {
    setNotice("");

    const result = await rejectContactExchangeRequestFromApi({
      currentUserPhone,
      requestId
    });

    setNotice(result.ok ? "已拒绝该联系方式交换请求。" : result.errors.request ?? "处理失败");
    await refresh();
  }

  async function handleWithdrawRequest(requestId: string) {
    setNotice("");

    const result = await withdrawContactExchangeRequestFromApi({
      currentUserPhone,
      requestId
    });

    setNotice(result.ok ? "已撤回该联系方式交换请求。" : result.errors.request ?? "处理失败");
    await refresh();
  }

  if (!loaded) {
    return (
      <section className="content-panel">
        <p>正在读取聊天会话...</p>
      </section>
    );
  }

  if (!conversation) {
    return (
      <section className="content-panel">
        <h1 className="section-title">聊天不可访问</h1>
        <p>未找到该会话，或当前账号不是会话参与者。</p>
        <div className="action-row">
          <Link className="button secondary" href="/profile/chats">
            返回我的聊天
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="wide-panel">
      <div className="workspace-header">
        <div>
          <span className="eyebrow">站内沟通</span>
          <h1 className="section-title">站内聊天</h1>
          <p>
            先在站内完成基础沟通；未完成双方同意和二次确认前，不展示任何联系方式。
          </p>
        </div>
        <Link className="button secondary" href="/profile/chats">
          返回我的聊天
        </Link>
      </div>

      <div className="conversation-workspace">
        <aside className="conversation-context">
          <span className="eyebrow">会话状态</span>
          <h2>
            {conversation.sourceType === "parent-need"
              ? "需求沟通"
              : "家教信息沟通"}
          </h2>
          <p>消息会自动轮询刷新；联系方式交换集中在右侧状态区处理。</p>
          <div className="context-stat">
            <strong>{messages.length}</strong>
            <span>条消息</span>
          </div>
          <div className="context-stat">
            <strong>{requests.length}</strong>
            <span>次交换请求</span>
          </div>
        </aside>

        <section className="chat-main conversation-main" aria-label="聊天消息">
          <div className="conversation-main-header">
            <div>
              <h2>消息区</h2>
              <p>请勿直接发送手机号、微信号或详细地址。</p>
            </div>
            <span className="status-pill">
              {authorizedProfiles ? "联系方式已授权" : "联系方式未授权"}
            </span>
          </div>

          <div className="message-list">
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

          <form className="chat-compose" onSubmit={handleSendMessage}>
            <label className="field" htmlFor="message-text">
              <span>发送文字消息</span>
              <textarea
                id="message-text"
                onChange={(event) => setMessageText(event.target.value)}
                placeholder="输入沟通内容，不要直接填写手机号、微信号或详细地址"
                rows={3}
                value={messageText}
              />
            </label>
            <button className="button primary" type="submit">
              发送
            </button>
          </form>
        </section>

        <aside className="chat-side contact-status-panel" aria-label="联系方式交换状态">
          <div>
            <span className="eyebrow">联系方式交换</span>
            <h2>联系方式交换</h2>
          </div>

          {authorizedProfiles ? (
            <div className="contact-panel">
              <h3>已授权展示</h3>
              <p>我的手机号：{authorizedProfiles.currentUser.phone}</p>
              <p>我的微信号：{authorizedProfiles.currentUser.wechat || "未填写"}</p>
              <p>对方手机号：{authorizedProfiles.otherUser.phone}</p>
              <p>对方微信号：{authorizedProfiles.otherUser.wechat || "未填写"}</p>
            </div>
          ) : (
            <p className="privacy-note">当前未完成交换授权，双方联系方式不会展示。</p>
          )}

          <button
            className="button primary full-width"
            onClick={handleCreateExchangeRequest}
            type="button"
          >
            请求交换联系方式
          </button>

          {notice ? <p className="success">{notice}</p> : null}

          <div className="exchange-list">
            {requests.length === 0 ? (
              <p className="empty-state">暂无交换请求。</p>
            ) : null}

            {requests.map((request) => {
              const isReceiver = request.direction === "received";
              const isRequester = request.direction === "sent";

              return (
                <article className="exchange-card" key={request.id}>
                  <div>
                    <strong>{statusLabels[request.status]}</strong>
                    <p>
                      {isRequester ? "我发起的请求" : "对方发起的请求"} /{" "}
                      {new Date(request.createdAt).toLocaleDateString("zh-CN")}
                    </p>
                  </div>

                  {request.status === "pending" && isReceiver ? (
                    <div className="exchange-actions">
                      <button
                        className="button primary"
                        onClick={() => void handleApproveRequest(request.id)}
                        type="button"
                      >
                        同意
                      </button>
                      <button
                        className="button secondary"
                        onClick={() => void handleRejectRequest(request.id)}
                        type="button"
                      >
                        拒绝
                      </button>
                    </div>
                  ) : null}

                  {request.status === "pending" && isRequester ? (
                    <button
                      className="button secondary"
                      onClick={() => void handleWithdrawRequest(request.id)}
                      type="button"
                    >
                      撤回
                    </button>
                  ) : null}
                </article>
              );
            })}
          </div>
        </aside>
      </div>
    </section>
  );
}

export default function ChatPage() {
  return (
    <div className="page dplus-chat-page">
      <RequireTestSession>
        {(session) => <ChatRoom currentUserPhone={session.userId ?? session.phone ?? ""} />}
      </RequireTestSession>
    </div>
  );
}
