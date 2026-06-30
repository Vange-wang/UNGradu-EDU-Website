"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { RequireTestSession } from "@/features/auth/require-test-session";
import { formatTutorFeeRange } from "@/features/tutor-profiles/tutor-profile";
import { listMyTutorProfilesFromApi } from "@/features/tutor-profiles/tutor-profile-api-client";
import type { ServerTutorProfile } from "@/server/tutor-profiles";

function TutorProfilesList({ ownerPhone }: { ownerPhone: string }) {
  const [profiles, setProfiles] = useState<ServerTutorProfile[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadProfiles() {
      const result = await listMyTutorProfilesFromApi({
        currentUserPhone: ownerPhone
      });

      if (!cancelled) {
        setProfiles(result.ok ? result.value : []);
      }
    }

    void loadProfiles();

    return () => {
      cancelled = true;
    };
  }, [ownerPhone]);

  return (
    <section className="wide-panel">
      <div className="workspace-header">
        <div>
          <span className="eyebrow">Profile Workspace</span>
          <h1 className="section-title">我的家教信息</h1>
          <p>查看自己发布的家教信息，或继续补充新的授课信息。</p>
        </div>
        <Link className="button secondary" href="/profile">
          返回个人中心
        </Link>
      </div>

      <div className="profile-list-toolbar">
        <div>
          <strong>{profiles.length}</strong>
          <span>条家教信息</span>
        </div>
        <Link className="button primary" href="/tutor-profiles/new">
          发布新家教信息
        </Link>
      </div>

      {profiles.length === 0 ? (
        <p className="empty-state">还没有发布家教信息。</p>
      ) : (
        <div className="record-list profile-record-list">
          {profiles.map((profile) => (
            <article className="record-card profile-record-card" key={profile.id}>
              <div className="record-card-header">
                <div>
                  <h2>
                    {profile.school} / {profile.major}
                  </h2>
                  <p>性别：{profile.gender}</p>
                </div>
                <span className="status-pill">家教信息</span>
              </div>
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
              <p>证明图片：{profile.proofImages.length} 张</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default function MyTutorProfilesPage() {
  return (
    <div className="page">
      <RequireTestSession>
        {(session) => <TutorProfilesList ownerPhone={session.userId ?? session.phone ?? ""} />}
      </RequireTestSession>
    </div>
  );
}
