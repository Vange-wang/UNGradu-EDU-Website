"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { RequireTestSession } from "@/features/auth/require-test-session";
import {
  readParentNeeds,
  type SavedParentNeed
} from "@/features/parent-needs/parent-need-storage";
import { getBrowserStorage } from "@/lib/storage";

function ParentNeedsList({ ownerPhone }: { ownerPhone: string }) {
  const [needs, setNeeds] = useState<SavedParentNeed[]>([]);

  useEffect(() => {
    const storage = getBrowserStorage();
    setNeeds(storage ? readParentNeeds({ ownerPhone, storage }) : []);
  }, [ownerPhone]);

  return (
    <section className="content-panel wide-panel">
      <h1 className="section-title">我发布的需求</h1>
      <p>当前测试账号：{ownerPhone}。这里展示 M2 本地测试保存的家长需求。</p>

      <div className="action-row">
        <Link className="button primary" href="/parent-needs/new">
          发布新需求
        </Link>
      </div>

      {needs.length === 0 ? (
        <p className="empty-state">还没有发布需求。</p>
      ) : (
        <div className="record-list">
          {needs.map((need) => (
            <article className="record-card" key={need.id}>
              <h2>
                {need.grade} · {need.subjects.join("、")}
              </h2>
              <p>
                {need.region.city} / {need.region.district} / {need.community}
              </p>
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
    <div className="page">
      <RequireTestSession>
        {(session) => <ParentNeedsList ownerPhone={session.phone} />}
      </RequireTestSession>
    </div>
  );
}
