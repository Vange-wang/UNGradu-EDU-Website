"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import {
  filterParentNeeds,
  readAllParentNeeds,
  type ParentNeedFilters,
  type SavedParentNeed
} from "@/features/parent-needs/parent-need-storage";
import { getBrowserStorage } from "@/lib/storage";

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

const emptyFilters: ParentNeedFilters = {
  subject: "",
  grade: "",
  budgetMin: "",
  budgetMax: "",
  teacherGenderPreference: ""
};

function readFiltersFromUrl(): ParentNeedFilters {
  const params = new URLSearchParams(window.location.search);

  return {
    subject: params.get("subject") ?? "",
    grade: params.get("grade") ?? "",
    budgetMin: params.get("budgetMin") ?? "",
    budgetMax: params.get("budgetMax") ?? "",
    teacherGenderPreference: params.get("teacherGenderPreference") ?? ""
  };
}

function writeFiltersToUrl(filters: ParentNeedFilters) {
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
  const [filters, setFilters] = useState<ParentNeedFilters>(emptyFilters);
  const [needs, setNeeds] = useState<SavedParentNeed[]>([]);

  useEffect(() => {
    const initialFilters = readFiltersFromUrl();
    const storage = getBrowserStorage();
    const allNeeds = storage ? readAllParentNeeds({ storage }) : [];

    setFilters(initialFilters);
    setNeeds(filterParentNeeds(allNeeds, initialFilters));
  }, []);

  function updateFilter<K extends keyof ParentNeedFilters>(
    field: K,
    value: ParentNeedFilters[K]
  ) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const storage = getBrowserStorage();
    const allNeeds = storage ? readAllParentNeeds({ storage }) : [];

    writeFiltersToUrl(filters);
    setNeeds(filterParentNeeds(allNeeds, filters));
  }

  function resetFilters() {
    const storage = getBrowserStorage();
    const allNeeds = storage ? readAllParentNeeds({ storage }) : [];

    setFilters(emptyFilters);
    writeFiltersToUrl(emptyFilters);
    setNeeds(allNeeds);
  }

  return (
    <div className="page">
      <section className="content-panel wide-panel">
        <div className="section-heading-row">
          <div>
            <h1 className="section-title">需求广场</h1>
            <p>按科目、学段、预算区间和性别偏好筛选家长需求。详情页不会展示联系方式。</p>
          </div>
          <Link className="button primary" href="/parent-needs/new">
            发布需求
          </Link>
        </div>

        <form className="filter-bar" onSubmit={applyFilters}>
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

        {needs.length === 0 ? (
          <p className="empty-state">当前没有符合条件的需求。</p>
        ) : (
          <div className="record-list">
            {needs.map((need) => (
              <article className="record-card" key={need.id}>
                <div className="record-card-header">
                  <h2>
                    {need.grade} · {need.subjects.join("、")}
                  </h2>
                  <Link className="button secondary" href={`/parent-needs/${need.id}`}>
                    查看详情
                  </Link>
                </div>
                <p>
                  区域：{need.region.city} / {need.region.district} / {need.community}
                </p>
                <p>
                  预算：{need.budgetMin}-{need.budgetMax} 元/小时；老师性别：
                  {need.teacherGenderPreference}
                </p>
                <p>简介：{need.childIntro}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
