"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { RequireTestSession } from "@/features/auth/require-test-session";
import { formatTutorFeeRange } from "@/features/tutor-profiles/tutor-profile";
import {
  deleteTutorProfileFromApi,
  listMyTutorProfilesFromApi,
  restoreTutorProfileFromApi
} from "@/features/tutor-profiles/tutor-profile-api-client";
import {
  filterTutorProfilesForManagementView,
  getTutorProfileRecoveryState,
  type TutorProfileManagementView
} from "@/features/tutor-profiles/tutor-profile-management";
import type { ServerTutorProfile } from "@/server/tutor-profiles";

type Notice = { kind: "error" | "success"; message: string } | null;

function TutorProfilesList({ ownerPhone }: { ownerPhone: string }) {
  const [profiles, setProfiles] = useState<ServerTutorProfile[]>([]);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<Notice>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [view, setView] = useState<TutorProfileManagementView>("active");

  useEffect(() => {
    let cancelled = false;

    async function loadProfiles() {
      setLoading(true);
      setLoadError("");
      const result = await listMyTutorProfilesFromApi({
        currentUserPhone: ownerPhone
      });

      if (!cancelled) {
        if (result.ok) {
          setProfiles(result.value);
        } else {
          setLoadError(result.errors.request ?? "家教信息列表加载失败");
        }
        setLoading(false);
      }
    }

    void loadProfiles();

    return () => {
      cancelled = true;
    };
  }, [ownerPhone, refreshIndex]);

  async function deleteProfile(profile: ServerTutorProfile) {
    if (!window.confirm(
      "删除后会立即从公开页面下架；48 小时内可以恢复。历史聊天保留，但删除期间不可发送消息或查看、交换联系方式。是否继续？"
    )) {
      return;
    }

    const result = await deleteTutorProfileFromApi({
      currentUserPhone: ownerPhone,
      id: profile.id,
      version: profile.version
    });
    setNotice({
      kind: result.ok ? "success" : "error",
      message: result.ok
        ? "家教信息已删除，可在 48 小时内恢复。"
        : result.errors.request ?? "删除失败"
    });
    if (result.ok) setRefreshIndex((value) => value + 1);
  }

  async function restoreProfile(profile: ServerTutorProfile) {
    const result = await restoreTutorProfileFromApi({
      currentUserPhone: ownerPhone,
      id: profile.id,
      version: profile.version
    });
    setNotice({
      kind: result.ok ? "success" : "error",
      message: result.ok
        ? "家教信息已恢复并重新公开。"
        : result.errors.request ?? "恢复失败"
    });
    if (result.ok) setRefreshIndex((value) => value + 1);
  }

  const counts = {
    active: filterTutorProfilesForManagementView(profiles, "active").length,
    deleted: filterTutorProfilesForManagementView(profiles, "deleted").length,
    legacy: filterTutorProfilesForManagementView(profiles, "legacy").length
  };
  const visibleProfiles = filterTutorProfilesForManagementView(profiles, view);

  return (
    <section className="wide-panel">
      <div className="workspace-header">
        <div>
          <span className="eyebrow">我的记录</span>
          <h1 className="section-title">我的家教信息</h1>
          <p>查看自己发布的家教信息，或继续补充新的授课信息。</p>
        </div>
        <Link className="button secondary" href="/profile">
          返回个人中心
        </Link>
      </div>

      <div className="profile-list-toolbar">
        <div>
          <strong>{visibleProfiles.length}</strong>
          <span>条当前分类记录</span>
        </div>
        <div className="dplus-list-tabs" aria-label="我的内容分类">
          <Link href="/profile/parent-needs">我的需求</Link>
          <span className="active">我的家教信息</span>
          <Link href="/profile/chats">我的聊天</Link>
        </div>
        <Link className="button primary" href="/tutor-profiles/new">
          发布新家教信息
        </Link>
      </div>

      <div className="management-view-tabs exchange-actions" aria-label="家教信息记录状态">
        {([
          ["active", `有效 (${counts.active})`],
          ["deleted", `已删除 / 待恢复 (${counts.deleted})`],
          ["legacy", `旧记录只读隔离 (${counts.legacy})`]
        ] as const).map(([value, label]) => (
          <button
            aria-pressed={view === value}
            className={`button ${view === value ? "primary" : "secondary"}`}
            key={value}
            onClick={() => setView(value)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      {notice ? (
        <p
          aria-live={notice.kind === "error" ? "assertive" : "polite"}
          className={notice.kind === "success" ? "success" : "privacy-note error"}
          role={notice.kind === "error" ? "alert" : "status"}
        >
          {notice.message}
        </p>
      ) : null}

      {loadError ? (
        <div className="privacy-note error" role="alert">
          <p>{loadError}</p>
          <button className="button secondary" onClick={() => setRefreshIndex((value) => value + 1)} type="button">
            重试加载
          </button>
        </div>
      ) : loading ? (
        <p className="empty-state">正在加载家教信息...</p>
      ) : visibleProfiles.length === 0 ? (
        <p className="empty-state">当前分类没有家教信息。</p>
      ) : (
        <div className="record-list profile-record-list">
          {visibleProfiles.map((profile) => {
            const recovery = getTutorProfileRecoveryState(profile.deletedAt);

            return (
            <article className="record-card profile-record-card" key={profile.id}>
              <div className="record-card-header">
                <div>
                  <h2>
                    {profile.school} / {profile.major}
                  </h2>
                  <p>性别：{profile.gender}</p>
                </div>
                <span className="status-pill">
                  {profile.managementState === "legacy-readonly"
                    ? "旧记录 · 暂不可管理"
                    : profile.status === "deleted"
                      ? "已删除"
                      : "有效"}
                </span>
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
              <p>
                创建：{new Date(profile.createdAt).toLocaleString("zh-CN")}
                {profile.updatedAt ? `；最近更新：${new Date(profile.updatedAt).toLocaleString("zh-CN")}` : ""}
              </p>
              {profile.managementState === "legacy-readonly" ? (
                <div className="privacy-note">
                  该旧记录缺少版本信息，仍可查看和保留原有关联，但暂不可修改、删除或恢复。请重新发布以启用管理能力。
                  <Link href="/tutor-profiles/new">重新发布</Link>
                </div>
              ) : profile.status === "deleted" ? (
                <div className="exchange-actions">
                  <span>
                    {recovery.canRestore ? "恢复期限" : "恢复期已过"}：
                    {recovery.deadline
                      ? new Date(recovery.deadline).toLocaleString("zh-CN")
                      : "不可用"}
                  </span>
                  {recovery.canRestore ? (
                    <button className="button secondary" onClick={() => void restoreProfile(profile)} type="button">
                      恢复
                    </button>
                  ) : null}
                </div>
              ) : (
                <div className="exchange-actions">
                  <Link className="button secondary" href={`/tutor-profiles/new?edit=${encodeURIComponent(profile.id)}`}>
                    编辑
                  </Link>
                  <button className="button secondary" onClick={() => void deleteProfile(profile)} type="button">
                    删除
                  </button>
                </div>
              )}
            </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function MyTutorProfilesPage() {
  return (
    <div className="page dplus-profile-page">
      <RequireTestSession>
        {(session) => <TutorProfilesList ownerPhone={session.userId ?? session.phone ?? ""} />}
      </RequireTestSession>
    </div>
  );
}
