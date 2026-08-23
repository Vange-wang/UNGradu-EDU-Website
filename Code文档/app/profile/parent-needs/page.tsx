"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { RequireTestSession } from "@/features/auth/require-test-session";
import {
  appealParentNeedReview,
  deleteParentNeedFromApi,
  listMyParentNeedsFromApi,
  restoreParentNeedFromApi,
  type ManagedParentNeed
} from "@/features/parent-needs/parent-need-api-client";
import { getContactReviewOwnerPresentation } from "@/features/contact-review/contact-review-owner-ui";
import {
  filterParentNeedsForManagementView,
  getParentNeedRecoveryState,
  type ParentNeedManagementView
} from "@/features/parent-needs/parent-need-management";

type Notice = { kind: "error" | "success"; message: string } | null;

function ParentNeedsList({ ownerPhone }: { ownerPhone: string }) {
  const [needs, setNeeds] = useState<ManagedParentNeed[]>([]);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<Notice>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [view, setView] = useState<ParentNeedManagementView>("active");

  useEffect(() => {
    let cancelled = false;

    async function loadNeeds() {
      setLoading(true);
      setLoadError("");
      const result = await listMyParentNeedsFromApi({
        currentUserPhone: ownerPhone
      });

      if (!cancelled) {
        if (result.ok) {
          setNeeds(result.value);
        } else {
          setLoadError(result.errors.request ?? "需求列表加载失败");
        }
        setLoading(false);
      }
    }

    void loadNeeds();

    return () => {
      cancelled = true;
    };
  }, [ownerPhone, refreshIndex]);

  async function deleteNeed(need: ManagedParentNeed) {
    if (!window.confirm(
      "删除后会立即从公开页面下架；48 小时内可以恢复。历史聊天保留，但删除期间不可发送消息或查看、交换联系方式。是否继续？"
    )) {
      return;
    }

    const result = await deleteParentNeedFromApi({
      currentUserPhone: ownerPhone,
      id: need.id,
      version: need.version
    });
    setNotice({
      kind: result.ok ? "success" : "error",
      message: result.ok
        ? "需求已删除，可在 48 小时内恢复。"
        : result.errors.request ?? "删除失败"
    });
    if (result.ok) setRefreshIndex((value) => value + 1);
  }

  async function restoreNeed(need: ManagedParentNeed) {
    const result = await restoreParentNeedFromApi({
      currentUserPhone: ownerPhone,
      id: need.id,
      version: need.version
    });
    setNotice({
      kind: result.ok ? "success" : "error",
      message: result.ok
        ? "需求已恢复并重新提交审核，审核完成前不会公开。"
        : result.errors.request ?? "恢复失败"
    });
    if (result.ok) setRefreshIndex((value) => value + 1);
  }

  async function appealNeed(need: ManagedParentNeed) {
    const result = await appealParentNeedReview({ id: need.id, version: need.version });
    setNotice({
      kind: result.ok ? "success" : "error",
      message: result.ok ? "申诉已提交，等待复核。" : result.errors.request ?? "申诉提交失败"
    });
    if (result.ok) setRefreshIndex((value) => value + 1);
  }

  const counts = {
    active: filterParentNeedsForManagementView(needs, "active").length,
    deleted: filterParentNeedsForManagementView(needs, "deleted").length,
    legacy: filterParentNeedsForManagementView(needs, "legacy").length
  };
  const visibleNeeds = filterParentNeedsForManagementView(needs, view);

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
          <strong>{visibleNeeds.length}</strong>
          <span>条当前分类记录</span>
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

      <div className="management-view-tabs exchange-actions" aria-label="需求记录状态">
        {([
          ["active", `有效 / 审核中 / 未通过 (${counts.active})`],
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
        <p className="empty-state">正在加载需求记录...</p>
      ) : visibleNeeds.length === 0 ? (
        <p className="empty-state">当前分类没有需求记录。</p>
      ) : (
        <div className="record-list profile-record-list">
          {visibleNeeds.map((need) => {
            const recovery = getParentNeedRecoveryState(need.deletedAt);
            const presentation = getContactReviewOwnerPresentation({
              canAppeal: need.canAppeal === true,
              canEdit: need.canEdit ?? (need.status === "published"),
              publicVisibility: need.publicVisibility ?? (need.status === "deleted" ? "deleted" : "published"),
              reviewStatus: need.reviewStatus ?? "published"
            });

            return (
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
                <span className="status-pill">
                  {need.managementState === "legacy-readonly"
                    ? "旧记录 · 暂不可管理"
                    : presentation.label}
                </span>
              </div>
              <p>
                预算：{need.budgetMin}-{need.budgetMax} 元/小时；老师性别：
                {need.teacherGenderPreference}
              </p>
              <p>时间：{need.timeSlots.join("、")}</p>
              {need.childIntro ? <p>孩子简介：{need.childIntro}</p> : null}
              <p>
                创建：{new Date(need.createdAt).toLocaleString("zh-CN")}
                {need.updatedAt ? `；最近更新：${new Date(need.updatedAt).toLocaleString("zh-CN")}` : ""}
              </p>
              {need.managementState === "legacy-readonly" ? (
                <div className="privacy-note">
                  该旧记录缺少版本信息，仍可查看和保留原有关联，但暂不可修改、删除或恢复。请重新发布以启用管理能力。
                  <Link href="/parent-needs/new">重新发布</Link>
                </div>
              ) : need.status === "deleted" ? (
                <div>
                  <p className="privacy-note">{presentation.message}</p>
                  <div className="exchange-actions">
                    <span>
                      {recovery.canRestore ? "恢复期限" : "恢复期已过"}：
                      {recovery.deadline
                        ? new Date(recovery.deadline).toLocaleString("zh-CN")
                        : "不可用"}
                    </span>
                    {recovery.canRestore ? (
                      <button className="button secondary" onClick={() => void restoreNeed(need)} type="button">
                        恢复
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="privacy-note">{presentation.message}</p>
                  <div className="exchange-actions">
                    {presentation.canEdit ? (
                      <Link className="button secondary" href={`/parent-needs/new?edit=${encodeURIComponent(need.id)}`}>
                        编辑
                      </Link>
                    ) : null}
                    {presentation.canAppeal ? (
                      <button className="button secondary" onClick={() => void appealNeed(need)} type="button">
                        提交申诉
                      </button>
                    ) : null}
                    <button className="button secondary" onClick={() => void deleteNeed(need)} type="button">
                      删除
                    </button>
                  </div>
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

export default function MyParentNeedsPage() {
  return (
    <div className="page dplus-profile-page">
      <RequireTestSession>
        {(session) => <ParentNeedsList ownerPhone={session.userId ?? session.phone ?? ""} />}
      </RequireTestSession>
    </div>
  );
}
