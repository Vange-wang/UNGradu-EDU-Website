"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { RequireTestSession } from "@/features/auth/require-test-session";
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
    <section className="content-panel wide-panel">
      <h1 className="section-title">我的家教信息</h1>
      <p>当前测试账号：{ownerPhone}。这里展示服务端 tutor_profiles 中属于当前账号的信息。</p>

      <div className="action-row">
        <Link className="button primary" href="/tutor-profiles/new">
          发布新家教信息
        </Link>
      </div>

      {profiles.length === 0 ? (
        <p className="empty-state">还没有发布家教信息。</p>
      ) : (
        <div className="record-list">
          {profiles.map((profile) => (
            <article className="record-card" key={profile.id}>
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
                  .map(
                    (range) =>
                      `${range.grade}${range.subject} ${range.min}-${range.max} 元/小时`
                  )
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
        {(session) => <TutorProfilesList ownerPhone={session.phone} />}
      </RequireTestSession>
    </div>
  );
}
