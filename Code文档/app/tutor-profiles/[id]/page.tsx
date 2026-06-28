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
    <div className="page">
      <section className="content-panel wide-panel">
        <div className="section-heading-row">
          <div>
            <h1 className="section-title">家教信息详情</h1>
            <p>详情页仅展示大学生家教信息，不展示存档联系方式。</p>
          </div>
          <Link className="button secondary" href="/tutor-profiles">
            返回家教信息广场
          </Link>
        </div>

        {loaded && !profile ? (
          <p className="empty-state">未找到该家教信息。</p>
        ) : null}

        {profile ? (
          <div className="detail-layout">
            <section className="detail-section">
              <h2>
                {profile.school} · {profile.major}
              </h2>
              <p>性别：{profile.gender}</p>
              <p>可教科目：{profile.subjects.join("、")}</p>
              <p>可教学段：{profile.grades.join("、")}</p>
              <p>可上课时间：{profile.timeSlots.join("、")}</p>
              <p>
                课时费：
                {profile.feeRanges
                  .map((range) => formatTutorFeeRange(range))
                  .join("；")}
              </p>
              <p>能力说明：{profile.abilityDescription}</p>
              <p>
                证明图片：当前仅展示已记录的文件元信息数量（{profile.proofImages.length} 条），
                不代表平台已完成正式图片上传、查看或审核。
              </p>
            </section>

            <aside className="detail-side">
              <h2>沟通入口</h2>
              <p>先通过站内文字聊天沟通，双方同意并二次确认后才展示联系方式。</p>
              <button
                className="button primary full-width"
                disabled={!sessionLoaded || !profile}
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
