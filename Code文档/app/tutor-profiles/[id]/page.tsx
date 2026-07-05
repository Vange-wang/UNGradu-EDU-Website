"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useTestSession } from "@/features/auth/use-test-session";
import { createConversationFromSourceToApi } from "@/features/chat/chat-api-client";
import { formatTutorFeeRange } from "@/features/tutor-profiles/tutor-profile";
import { readPublicTutorProfileFromApi } from "@/features/tutor-profiles/tutor-profile-api-client";
import type { PublicServerTutorProfile } from "@/server/tutor-profiles";

export default function TutorProfileDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { loaded: sessionLoaded, session } = useTestSession();
  const [profile, setProfile] = useState<PublicServerTutorProfile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [chatError, setChatError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      const result = await readPublicTutorProfileFromApi({ id: params.id });

      if (!cancelled) {
        setProfile(result.ok ? result.value : null);
        setLoaded(true);
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  async function startChat() {
    setChatError("");

    if (!session) {
      router.push(`/login?next=${encodeURIComponent(`/tutor-profiles/${params.id}`)}`);
      return;
    }

    if (!profile) {
      return;
    }

    const result = await createConversationFromSourceToApi({
      currentUserPhone: session.userId ?? session.phone ?? "",
      sourceId: profile.id,
      sourceType: "tutor-profile"
    });

    if (!result.ok) {
      setChatError(result.errors.request ?? "发起聊天失败");
      return;
    }

    router.push(`/chats/${result.value.id}`);
  }

  return (
    <div className="page dplus-business-page">
      <section className="detail-hero">
        <div className="market-copy">
          <span className="eyebrow">家教详情</span>
          <h1 className="section-title">结构化老师资料</h1>
          <p>详情页仅展示可公开的授课信息，不展示存档联系方式。</p>
          <p className="dplus-panel-note">下一步是站内沟通，不是认证、担保或自动推荐。</p>
        </div>
        <Link className="button secondary" href="/tutor-profiles">
          返回家教信息广场
        </Link>
      </section>

      {loaded && !profile ? (
        <p className="empty-state">未找到该家教信息。</p>
      ) : null}

      {profile ? (
        <div className="detail-sheet">
          <article className="detail-main">
            <span className="eyebrow">老师资料</span>
            <span className="status-pill">公开资料 · 联系方式未公开</span>
            <h2>
              {profile.school} · {profile.major}
            </h2>

            <div className="detail-facts">
              <div>
                <span>性别</span>
                <strong>{profile.gender}</strong>
              </div>
              <div>
                <span>可教科目</span>
                <strong>{profile.subjects.join("、")}</strong>
              </div>
              <div>
                <span>可教学段</span>
                <strong>{profile.grades.join("、")}</strong>
              </div>
              <div>
                <span>可上课时间</span>
                <strong>{profile.timeSlots.join("、")}</strong>
              </div>
            </div>

            <section className="detail-card">
              <h3>课时费</h3>
              <p>
                {profile.feeRanges
                  .map((range) => formatTutorFeeRange(range))
                  .join("；")}
              </p>
            </section>

            <section className="detail-card">
              <h3>能力说明</h3>
              <p>{profile.abilityDescription}</p>
            </section>

            <section className="detail-card">
              <h3>证明图片</h3>
              <p>
                当前仅展示已记录的文件元信息数量（{profile.proofImages.length} 条），
                不代表平台已完成正式图片上传、查看或审核。
              </p>
            </section>
          </article>

          <aside className="detail-actions">
            <span className="eyebrow">沟通入口</span>
            <h2>先站内聊天，再授权交换联系方式</h2>
            <div className="contact-state-card">
              <strong>联系方式未公开</strong>
              <span>当前只展示授课资料，手机号、微信号和内部账号标识均不会出现在公开详情中。</span>
            </div>
            <p>
              先通过站内文字聊天沟通，双方同意并二次确认后才展示联系方式。
            </p>
            <button
              className="button primary full-width"
              disabled={!sessionLoaded || !profile}
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
