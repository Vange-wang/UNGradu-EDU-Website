"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import {
  findTutorProfileById,
  type SavedTutorProfile
} from "@/features/tutor-profiles/tutor-profile-storage";
import { getBrowserStorage } from "@/lib/storage";

export default function TutorProfileDetailPage() {
  const params = useParams<{ id: string }>();
  const [profile, setProfile] = useState<SavedTutorProfile | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const storage = getBrowserStorage();
    const detail = storage
      ? findTutorProfileById({ id: params.id, storage })
      : null;

    setProfile(detail);
    setLoaded(true);
  }, [params.id]);

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
          <p className="empty-state">未找到该家教信息，可能尚未在当前浏览器本地保存。</p>
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
                  .map(
                    (range) =>
                      `${range.grade}${range.subject} ${range.min}-${range.max} 元/小时`
                  )
                  .join("；")}
              </p>
              <p>能力说明：{profile.abilityDescription}</p>
              <p>证明图片：{profile.proofImages.length} 张</p>
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
