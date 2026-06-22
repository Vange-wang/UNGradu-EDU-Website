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
      currentUserPhone: session.phone,
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
      <section className="content-panel wide-panel">
        <div className="section-heading-row">
          <div>
            <h1 className="section-title">需求详情</h1>
            <p>详情页仅展示结构化需求信息，不展示家长联系方式。</p>
          </div>
          <Link className="button secondary" href="/parent-needs">
            返回需求广场
          </Link>
        </div>

        {loaded && !need ? (
          <p className="empty-state">未找到该需求。</p>
        ) : null}

        {need ? (
          <div className="detail-layout">
            <section className="detail-section">
              <h2>{need.grade} · {need.subjects.join("、")}</h2>
              <p>
                区域：{need.region.province} / {need.region.city} /{" "}
                {need.region.district} / {need.community}
              </p>
              <p>
                预算：{need.budgetMin}-{need.budgetMax} 元/小时
              </p>
              <p>希望老师性别：{need.teacherGenderPreference}</p>
              <p>可上课时间：{need.timeSlots.join("、")}</p>
              <p>孩子简介：{need.childIntro}</p>
            </section>

            <aside className="detail-side">
              <h2>沟通入口</h2>
              <p>先通过站内文字聊天沟通，双方同意并二次确认后才展示联系方式。</p>
              <button
                className="button primary full-width"
                disabled={!sessionLoaded || !need}
                onClick={() => void startChat()}
                type="button"
              >
                发起站内聊天
              </button>
              {chatError ? <p className="error">{chatError}</p> : null}
            </aside>
          </div>
        ) : null}
      </section>
    </div>
  );
}
