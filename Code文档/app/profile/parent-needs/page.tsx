"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { RequireTestSession } from "@/features/auth/require-test-session";
import { listMyParentNeedsFromApi } from "@/features/parent-needs/parent-need-api-client";
import type { ServerParentNeed } from "@/server/parent-needs";

function ParentNeedsList({ ownerPhone }: { ownerPhone: string }) {
  const [needs, setNeeds] = useState<ServerParentNeed[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadNeeds() {
      const result = await listMyParentNeedsFromApi({
        currentUserPhone: ownerPhone
      });

      if (!cancelled) {
        setNeeds(result.ok ? result.value : []);
      }
    }

    void loadNeeds();

    return () => {
      cancelled = true;
    };
  }, [ownerPhone]);

  return (
    <section className="wide-panel">
      <div className="workspace-header">
        <div>
          <span className="eyebrow">我的记录</span>
          <h1 className="section-title">我发布的需求</h1>
          <p>查看自己发布的找家教需求，或继续发布新的需求。</p>
        </div>
        <Link className="button secondary" href="/profile">
          返回个人中心
        </Link>
      </div>

      <div className="profile-list-toolbar">
        <div>
          <strong>{needs.length}</strong>
          <span>条需求记录</span>
        </div>
        <div className="dplus-list-tabs" aria-label="我的内容分类">
          <span className="active">我的需求</span>
          <Link href="/profile/tutor-profiles">我的家教信息</Link>
          <Link href="/profile/chats">我的聊天</Link>
        </div>
        <Link className="button primary" href="/parent-needs/new">
          发布新需求
        </Link>
      </div>

      {needs.length === 0 ? (
        <p className="empty-state">还没有发布需求。</p>
      ) : (
        <div className="record-list profile-record-list">
          {needs.map((need) => (
            <article className="record-card profile-record-card" key={need.id}>
              <div className="record-card-header">
                <div>
                  <h2>
                    {need.grade} / {need.subjects.join("、")}
                  </h2>
                  <p>
                    {need.region.city} / {need.region.district} / {need.community}
                  </p>
                </div>
                <span className="status-pill">需求</span>
              </div>
              <p>
                预算：{need.budgetMin}-{need.budgetMax} 元/小时；老师性别：
                {need.teacherGenderPreference}
              </p>
              <p>时间：{need.timeSlots.join("、")}</p>
              {need.childIntro ? <p>孩子简介：{need.childIntro}</p> : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default function MyParentNeedsPage() {
  return (
    <div className="page dplus-profile-page">
      <RequireTestSession>
        {(session) => <ParentNeedsList ownerPhone={session.userId ?? session.phone ?? ""} />}
      </RequireTestSession>
    </div>
  );
}
