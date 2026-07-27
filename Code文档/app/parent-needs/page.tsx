"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { listPublicParentNeedsFromApi } from "@/features/parent-needs/parent-need-api-client";
import type {
  PublicServerParentNeed,
  ServerParentNeedFilters
} from "@/server/parent-needs";

const subjectOptions = ["", "语文", "数学", "英语", "物理", "化学", "生物"];
const gradeOptions = [
  "",
  "小学一至三年级",
  "小学四至六年级",
  "初一",
  "初二",
  "初三",
  "高中"
];
const genderOptions = ["", "不限", "女老师", "男老师"];

const emptyFilters: ServerParentNeedFilters = {
  subject: "",
  grade: "",
  budgetMin: "",
  budgetMax: "",
  teacherGenderPreference: ""
};

function readFiltersFromUrl(): ServerParentNeedFilters {
  const params = new URLSearchParams(window.location.search);

  return {
    subject: params.get("subject") ?? "",
    grade: params.get("grade") ?? "",
    budgetMin: params.get("budgetMin") ?? "",
    budgetMax: params.get("budgetMax") ?? "",
    teacherGenderPreference: params.get("teacherGenderPreference") ?? ""
  };
}

function writeFiltersToUrl(filters: ServerParentNeedFilters) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value?.trim()) {
      params.set(key, value.trim());
    }
  });

  const query = params.toString();
  window.history.pushState(null, "", query ? `/parent-needs?${query}` : "/parent-needs");
}

export default function ParentNeedsPage() {
  const [filters, setFilters] = useState<ServerParentNeedFilters>(emptyFilters);
  const [needs, setNeeds] = useState<PublicServerParentNeed[]>([]);

  async function loadNeeds(nextFilters: ServerParentNeedFilters) {
    const result = await listPublicParentNeedsFromApi({ filters: nextFilters });
    setNeeds(result.ok ? result.value : []);
  }

  useEffect(() => {
    const initialFilters = readFiltersFromUrl();
    setFilters(initialFilters);
    void loadNeeds(initialFilters);
  }, []);

  function updateFilter<K extends keyof ServerParentNeedFilters>(
    field: K,
    value: ServerParentNeedFilters[K]
  ) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    writeFiltersToUrl(filters);
    void loadNeeds(filters);
  }

  function resetFilters() {
    setFilters(emptyFilters);
    writeFiltersToUrl(emptyFilters);
    void loadNeeds(emptyFilters);
  }

  return (
    <div className="page dplus-business-page sitewide-refresh-page marketplace-refresh-page">
      <Link aria-label="返回首页" className="page-back-arrow" href="/">
        <span aria-hidden="true">←</span>
      </Link>
      <div className="marketplace-refresh-shell">
        <section className="market-header">
        <div className="market-copy">
          <span className="eyebrow">家长需求</span>
          <h1 className="section-title">需求广场</h1>
          <p>
            按科目、学段、预算区间和性别偏好筛选家长需求；公开详情不展示联系方式，先站内沟通再决定是否交换。
          </p>
          <div className="market-safety-strip" aria-label="需求广场隐私规则">
            <span>公开信息</span>
            <span>站内沟通</span>
            <span>双方同意后交换</span>
          </div>
        </div>
        <div className="action-row compact-actions">
          <Link className="button primary" href="/parent-needs/new">
            发布需求
          </Link>
        </div>
      </section>

      <section
        className="workbench-layout marketplace-refresh-main"
        aria-label="需求筛选与结果"
      >
        <aside className="filter-panel">
          <div className="filter-panel-heading">
            <span className="eyebrow">筛选需求</span>
            <h2>缩小查找范围</h2>
            <p>先筛出匹配的科目、年级和预算，再进入详情发起站内聊天。</p>
            <p className="dplus-panel-note">公开列表只展示需求信息，不展示手机号、微信号或邮箱。</p>
          </div>

          <form className="filter-stack" onSubmit={applyFilters}>
            <div className="field">
              <label htmlFor="need-subject">科目</label>
              <select
                id="need-subject"
                onChange={(event) => updateFilter("subject", event.target.value)}
                value={filters.subject}
              >
                {subjectOptions.map((subject) => (
                  <option key={subject || "all"} value={subject}>
                    {subject || "全部"}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="need-grade">学段</label>
              <select
                id="need-grade"
                onChange={(event) => updateFilter("grade", event.target.value)}
                value={filters.grade}
              >
                {gradeOptions.map((grade) => (
                  <option key={grade || "all"} value={grade}>
                    {grade || "全部"}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="need-budget-min">预算下限</label>
              <input
                id="need-budget-min"
                inputMode="numeric"
                onChange={(event) => updateFilter("budgetMin", event.target.value)}
                value={filters.budgetMin}
              />
            </div>

            <div className="field">
              <label htmlFor="need-budget-max">预算上限</label>
              <input
                id="need-budget-max"
                inputMode="numeric"
                onChange={(event) => updateFilter("budgetMax", event.target.value)}
                value={filters.budgetMax}
              />
            </div>

            <div className="field">
              <label htmlFor="need-gender">性别偏好</label>
              <select
                id="need-gender"
                onChange={(event) =>
                  updateFilter("teacherGenderPreference", event.target.value)
                }
                value={filters.teacherGenderPreference}
              >
                {genderOptions.map((gender) => (
                  <option key={gender || "all"} value={gender}>
                    {gender || "全部"}
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

        <div className="result-panel">
          <div className="result-panel-head">
            <div>
              <span className="eyebrow">当前结果</span>
              <h2>可沟通的需求</h2>
            </div>
            <span className="result-count">{needs.length} 条</span>
          </div>

          {needs.length === 0 ? (
            <p className="empty-state">当前没有符合条件的需求。</p>
          ) : (
            <div className="record-list">
              {needs.map((need) => (
                <article className="record-card listing-card" key={need.id}>
                  <div className="record-card-header">
                    <div>
                      <span className="listing-card-meta">需求</span>
                      <h2>
                        {need.grade} · {need.subjects.join("、")}
                      </h2>
                    </div>
                    <div className="listing-action-stack">
                      <span className="status-pill privacy-status">联系方式未公开</span>
                      <Link className="button secondary" href={`/parent-needs/${need.id}`}>
                        查看详情
                      </Link>
                    </div>
                  </div>
                  <p>
                    区域：{need.region.city} / {need.region.district} / {need.community}
                  </p>
                  <p>
                    预算：{need.budgetMin}-{need.budgetMax} 元/小时；老师性别：
                    {need.teacherGenderPreference}
                  </p>
                  <p>简介：{need.childIntro}</p>
                  <p className="listing-note">先进入详情发起站内沟通，确认合适后再申请交换联系方式。</p>
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
