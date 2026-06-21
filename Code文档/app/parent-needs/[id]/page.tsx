"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import {
  findParentNeedById,
  type SavedParentNeed
} from "@/features/parent-needs/parent-need-storage";
import { getBrowserStorage } from "@/lib/storage";

export default function ParentNeedDetailPage() {
  const params = useParams<{ id: string }>();
  const [need, setNeed] = useState<SavedParentNeed | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const storage = getBrowserStorage();
    const detail = storage
      ? findParentNeedById({ id: params.id, storage })
      : null;

    setNeed(detail);
    setLoaded(true);
  }, [params.id]);

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
          <p className="empty-state">未找到该需求，可能尚未在当前浏览器本地保存。</p>
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
              <p>M4 将实现站内聊天。当前 M3 只开放浏览和详情查看。</p>
            </aside>
          </div>
        ) : null}
      </section>
    </div>
  );
}
