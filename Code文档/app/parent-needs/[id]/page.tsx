"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useTestSession } from "@/features/auth/use-test-session";
import { createConversationFromSourceToApi } from "@/features/chat/chat-api-client";
import { readPublicParentNeedFromApi } from "@/features/parent-needs/parent-need-api-client";
import type { PublicServerParentNeed } from "@/server/parent-needs";

export default function ParentNeedDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { loaded: sessionLoaded, session } = useTestSession();
  const [need, setNeed] = useState<PublicServerParentNeed | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [chatError, setChatError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadNeed() {
      const result = await readPublicParentNeedFromApi({ id: params.id });

      if (!cancelled) {
        setNeed(result.ok ? result.value : null);
        setLoaded(true);
      }
    }

    void loadNeed();

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  async function startChat() {
    setChatError("");

    if (!session) {
      router.push(`/login?next=${encodeURIComponent(`/parent-needs/${params.id}`)}`);
      return;
    }

    if (!need) {
      return;
    }

    const result = await createConversationFromSourceToApi({
      currentUserPhone: session.userId ?? session.phone ?? "",
      sourceId: need.id,
      sourceType: "parent-need"
    });

    if (!result.ok) {
      setChatError(result.errors.request ?? "发起聊天失败");
      return;
    }

    router.push(`/chats/${result.value.id}`);
  }

  return (
    <div className="page">
      <section className="detail-hero">
        <div className="market-copy">
          <span className="eyebrow">需求详情</span>
          <h1 className="section-title">结构化需求信息</h1>
          <p>详情页仅展示学习需求、区域和预算等公开信息，不展示家长联系方式。</p>
        </div>
        <Link className="button secondary" href="/parent-needs">
          返回需求广场
        </Link>
      </section>

      {loaded && !need ? (
        <p className="empty-state">未找到该需求。</p>
      ) : null}

      {need ? (
        <div className="detail-sheet">
          <article className="detail-main">
            <span className="eyebrow">找老师需求</span>
            <h2>
              {need.grade} · {need.subjects.join("、")}
            </h2>

            <div className="detail-facts">
              <div>
                <span>区域</span>
                <strong>
                  {need.region.province} / {need.region.city} / {need.region.district}
                </strong>
                <p>{need.community}</p>
              </div>
              <div>
                <span>预算</span>
                <strong>
                  {need.budgetMin}-{need.budgetMax} 元/小时
                </strong>
              </div>
              <div>
                <span>老师性别</span>
                <strong>{need.teacherGenderPreference}</strong>
              </div>
              <div>
                <span>可上课时间</span>
                <strong>{need.timeSlots.join("、")}</strong>
              </div>
            </div>

            <section className="detail-card">
              <h3>孩子情况</h3>
              <p>{need.childIntro}</p>
            </section>
          </article>

          <aside className="detail-actions">
            <span className="eyebrow">沟通入口</span>
            <h2>先站内聊天，再授权交换联系方式</h2>
            <p>
              先通过站内文字聊天沟通，双方同意并二次确认后才展示联系方式。
            </p>
            <button
              className="button primary full-width"
              disabled={!sessionLoaded || !need}
              onClick={() => void startChat()}
              type="button"
            >
              发起站内聊天
            </button>
            {chatError ? <p className="error">{chatError}</p> : null}
            <p className="detail-note">公开详情不会展示手机号、微信号或内部账号标识。</p>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
