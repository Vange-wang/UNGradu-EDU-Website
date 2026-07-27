"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { listPublicTutorProfilesFromApi } from "@/features/tutor-profiles/tutor-profile-api-client";
import type {
  PublicServerTutorProfile,
  ServerTutorProfileFilters
} from "@/server/tutor-profiles";

const subjectOptions = ["", "语文", "数学", "英语", "物理", "化学", "生物"];
const gradeOptions = ["", "小学", "初中", "高中"];
const genderOptions = ["", "女", "男"];

const emptyFilters: ServerTutorProfileFilters = {
  subject: "",
  grade: "",
  feeMin: "",
  feeMax: "",
  gender: ""
};

function formatTutorFeeSummary(profile: PublicServerTutorProfile) {
  const minimums = profile.feeRanges.map((range) => range.min);
  const maximums = profile.feeRanges.map((range) => range.max);

  if (minimums.length === 0 || maximums.length === 0) {
    return "面议";
  }

  return `${Math.min(...minimums)} - ${Math.max(...maximums)} 元 / 小时`;
}

function readFiltersFromUrl(): ServerTutorProfileFilters {
  const params = new URLSearchParams(window.location.search);

  return {
    subject: params.get("subject") ?? "",
    grade: params.get("grade") ?? "",
    feeMin: params.get("feeMin") ?? "",
    feeMax: params.get("feeMax") ?? "",
    gender: params.get("gender") ?? ""
  };
}

function writeFiltersToUrl(filters: ServerTutorProfileFilters) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value?.trim()) {
      params.set(key, value.trim());
    }
  });

  const query = params.toString();
  window.history.pushState(null, "", query ? `/tutor-profiles?${query}` : "/tutor-profiles");
}

export default function TutorProfilesPage() {
  const [filters, setFilters] = useState<ServerTutorProfileFilters>(emptyFilters);
  const [profiles, setProfiles] = useState<PublicServerTutorProfile[]>([]);
  const hasActiveFilters = Object.values(filters).some((value) => value?.trim());
  const usesApprovedVisualFixture =
    !hasActiveFilters &&
    profiles.length === 1 &&
    profiles[0]?.id === "approved-tutor-visual-fixture";

  async function loadProfiles(nextFilters: ServerTutorProfileFilters) {
    const result = await listPublicTutorProfilesFromApi({ filters: nextFilters });
    setProfiles(result.ok ? result.value : []);
  }

  useEffect(() => {
    const initialFilters = readFiltersFromUrl();
    setFilters(initialFilters);
    void loadProfiles(initialFilters);
  }, []);

  function updateFilter<K extends keyof ServerTutorProfileFilters>(
    field: K,
    value: ServerTutorProfileFilters[K]
  ) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    writeFiltersToUrl(filters);
    void loadProfiles(filters);
  }

  function resetFilters() {
    setFilters(emptyFilters);
    writeFiltersToUrl(emptyFilters);
    void loadProfiles(emptyFilters);
  }

  return (
    <div className="page dplus-business-page sitewide-refresh-page marketplace-refresh-page tutor-profiles-native-static-reference">
      <Link aria-label="返回首页" className="page-back-arrow" href="/">
        <span aria-hidden="true">←</span>
      </Link>
      <div className="marketplace-refresh-shell">
        <section className="market-header">
        <div className="market-copy">
          <span className="eyebrow">老师资料</span>
          <h1 className="section-title">家教信息广场</h1>
          <p>
            按科目、学段、课时费和性别筛选大学生家教信息；公开详情不展示联系方式，先站内沟通再决定是否交换。
          </p>
          <div className="market-safety-strip" aria-label="家教广场隐私规则">
            <span>公开资料</span>
            <span>站内沟通</span>
            <span>双方同意后交换</span>
          </div>
        </div>
        <div className="action-row compact-actions">
          <Link className="button primary" href="/tutor-profiles/new">
            发布家教信息
          </Link>
        </div>
      </section>

      <section
        className="workbench-layout marketplace-refresh-main"
        aria-label="家教信息筛选与结果"
      >
        <aside className="filter-panel">
          <div className="filter-panel-heading">
            <span className="eyebrow">筛选老师</span>
            <h2>缩小查找范围</h2>
            <p>先筛出匹配的可教科目、学段和课时费，再进入详情发起站内聊天。</p>
            <p className="dplus-panel-note">公开列表只展示家教资料，不展示手机号、微信号或邮箱。</p>
          </div>

          <form className="filter-stack" onSubmit={applyFilters}>
            <div className="field">
              <label htmlFor="tutor-subject">科目</label>
              <select
                data-has-value={filters.subject ? "true" : "false"}
                id="tutor-subject"
                onChange={(event) => updateFilter("subject", event.target.value)}
                value={filters.subject}
              >
                {subjectOptions.map((subject) => (
                  <option key={subject || "all"} value={subject}>
                    {subject || "请选择科目"}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="tutor-grade">学段</label>
              <select
                data-has-value={filters.grade ? "true" : "false"}
                id="tutor-grade"
                onChange={(event) => updateFilter("grade", event.target.value)}
                value={filters.grade}
              >
                {gradeOptions.map((grade) => (
                  <option key={grade || "all"} value={grade}>
                    {grade || "请选择学段"}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="tutor-fee-min">课时费下限</label>
              <input
                data-has-value={filters.feeMin ? "true" : "false"}
                id="tutor-fee-min"
                inputMode="numeric"
                onChange={(event) => updateFilter("feeMin", event.target.value)}
                placeholder="课输入下限"
                value={filters.feeMin}
              />
            </div>

            <div className="field">
              <label htmlFor="tutor-fee-max">课时费上限</label>
              <input
                data-has-value={filters.feeMax ? "true" : "false"}
                id="tutor-fee-max"
                inputMode="numeric"
                onChange={(event) => updateFilter("feeMax", event.target.value)}
                placeholder="课输入上限"
                value={filters.feeMax}
              />
            </div>

            <div className="field">
              <label htmlFor="tutor-gender">性别</label>
              <select
                data-has-value={filters.gender ? "true" : "false"}
                id="tutor-gender"
                onChange={(event) => updateFilter("gender", event.target.value)}
                value={filters.gender}
              >
                {genderOptions.map((gender) => (
                  <option key={gender || "all"} value={gender}>
                    {gender || "不限"}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-actions">
              <button className="button primary" type="submit">
                筛选
              </button>
              <button className="button secondary" onClick={resetFilters} type="button">
                重置
              </button>
            </div>
          </form>
        </aside>

        <div
          className="result-panel"
          data-result-state={usesApprovedVisualFixture ? "fixture" : "live"}
        >
          <div className="result-panel-head">
            <div>
              <span className="eyebrow">当前结果</span>
              <h2>可沟通的家教信息</h2>
            </div>
            <span className="result-count">{profiles.length} 条</span>
          </div>

          {profiles.length === 0 ? (
            <p className="empty-state">当前没有符合条件的家教信息。</p>
          ) : (
            <div className="record-list">
              {profiles.map((profile) => (
                <article className="record-card listing-card" key={profile.id}>
                  <div className="record-card-header">
                    <div>
                      <span className="listing-card-meta">老师资料</span>
                      <h2>
                        {profile.school} · {profile.major}
                      </h2>
                    </div>
                    <div className="listing-action-stack">
                      <span className="status-pill privacy-status">联系方式未公开</span>
                      <Link className="button secondary" href={`/tutor-profiles/${profile.id}`}>
                        查看详情
                      </Link>
                    </div>
                  </div>
                  <p>
                    <span>性别：</span>
                    <strong>{profile.gender}</strong>
                  </p>
                  <p>
                    <span>可教科目：</span>
                    <strong>{profile.subjects.join("、")}</strong>
                  </p>
                  <p>
                    <span>可教学段：</span>
                    <strong>{profile.grades.join("、")}</strong>
                  </p>
                  <p>
                    <span>课时费：</span>
                    <strong>{formatTutorFeeSummary(profile)}</strong>
                  </p>
                  <p>能力说明：{profile.abilityDescription}</p>
                  <p className="listing-note">公开资料只用于初步判断，沟通和联系方式交换都在站内完成。</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
      </div>
    </div>
  );
}
