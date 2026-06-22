"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { RequireTestSession } from "@/features/auth/require-test-session";
import { readConversationsFromApi } from "@/features/chat/chat-api-client";
import type { ServerConversationView } from "@/server/conversations";

function ChatList({ currentUserPhone }: { currentUserPhone: string }) {
  const [conversations, setConversations] = useState<ServerConversationView[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadConversations() {
      const result = await readConversationsFromApi({ currentUserPhone });

      if (!cancelled) {
        setConversations(result.ok ? result.value : []);
      }
    }

    void loadConversations();

    return () => {
      cancelled = true;
    };
  }, [currentUserPhone]);

  return (
    <section className="content-panel wide-panel">
      <h1 className="section-title">我的聊天</h1>
      <p>这里只显示当前测试账号参与的站内会话。</p>

      {conversations.length === 0 ? (
        <p className="empty-state">暂无聊天。可从需求详情或家教信息详情发起。</p>
      ) : null}

      <div className="record-list">
        {conversations.map((conversation) => {
          return (
            <Link
              className="record-card"
              href={`/chats/${conversation.id}`}
              key={conversation.id}
            >
              <div className="record-card-header">
                <div>
                  <h2>
                    {conversation.sourceType === "parent-need"
                      ? "需求沟通"
                      : "家教信息沟通"}
                  </h2>
                  <p>来源 ID：{conversation.sourceId}</p>
                </div>
                <span className="status-pill">进入聊天</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default function MyChatsPage() {
  return (
    <div className="page">
      <RequireTestSession>
        {(session) => <ChatList currentUserPhone={session.phone} />}
      </RequireTestSession>
    </div>
  );
}
