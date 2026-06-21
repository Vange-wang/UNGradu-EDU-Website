"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import {
  filterTutorProfiles,
  readAllTutorProfiles,
  type SavedTutorProfile,
  type TutorProfileFilters
} from "@/features/tutor-profiles/tutor-profile-storage";
import { getBrowserStorage } from "@/lib/storage";

const subjectOptions = ["", "语文", "数学", "英语", "物理", "化学", "生物"];
const gradeOptions = ["", "小学", "初中", "高中"];
const genderOptions = ["", "女", "男"];

const emptyFilters: TutorProfileFilters = {
  subject: "",
  grade: "",
  feeMin: "",
  feeMax: "",
  gender: ""
};

function readFiltersFromUrl(): TutorProfileFilters {
  const params = new URLSearchParams(window.location.search);

  return {
    subject: params.get("subject") ?? "",
    grade: params.get("grade") ?? "",
    feeMin: params.get("feeMin") ?? "",
    feeMax: params.get("feeMax") ?? "",
    gender: params.get("gender") ?? ""
  };
}

function writeFiltersToUrl(filters: TutorProfileFilters) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value?.trim()) {
      params.set(key, value.trim());
    }
  });

  const query = params.toString();
  window.history.pushState(
    null,
    "",
    query ? `/tutor-profiles?${query}` : "/tutor-profiles"
  );
}

export default function TutorProfilesPage() {
  const [filters, setFilters] = useState<TutorProfileFilters>(emptyFilters);
  const [profiles, setProfiles] = useState<SavedTutorProfile[]>([]);

  useEffect(() => {
    const initialFilters = readFiltersFromUrl();
    const storage = getBrowserStorage();
    const allProfiles = storage ? readAllTutorProfiles({ storage }) : [];

    setFilters(initialFilters);
    setProfiles(filterTutorProfiles(allProfiles, initialFilters));
  }, []);

  function updateFilter<K extends keyof TutorProfileFilters>(
    field: K,
    value: TutorProfileFilters[K]
  ) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const storage = getBrowserStorage();
    const allProfiles = storage ? readAllTutorProfiles({ storage }) : [];

    writeFiltersToUrl(filters);
    setProfiles(filterTutorProfiles(allProfiles, filters));
  }

  function resetFilters() {
    const storage = getBrowserStorage();
    const allProfiles = storage ? readAllTutorProfiles({ storage }) : [];

    setFilters(emptyFilters);
    writeFiltersToUrl(emptyFilters);
    setProfiles(allProfiles);
  }

  return (
    <div className="page">
      <section className="content-panel wide-panel">
        <div className="section-heading-row">
          <div>
            <h1 className="section-title">家教信息广场</h1>
            <p>按科目、学段、课时费区间和性别筛选大学生家教信息。详情页不会展示联系方式。</p>
          </div>
          <Link className="button primary" href="/tutor-profiles/new">
            发布家教信息
          </Link>
        </div>

        <form className="filter-bar" onSubmit={applyFilters}>
          <div className="field">
            <label htmlFor="profile-subject">科目</label>
            <select
              id="profile-subject"
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
            <label htmlFor="profile-grade">学段</label>
            <select
              id="profile-grade"
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
            <label htmlFor="profile-fee-min">课时费下限</label>
            <input
              id="profile-fee-min"
              inputMode="numeric"
              onChange={(event) => updateFilter("feeMin", event.target.value)}
              value={filters.feeMin}
            />
          </div>

          <div className="field">
            <label htmlFor="profile-fee-max">课时费上限</label>
            <input
              id="profile-fee-max"
              inputMode="numeric"
              onChange={(event) => updateFilter("feeMax", event.target.value)}
              value={filters.feeMax}
            />
          </div>

          <div className="field">
            <label htmlFor="profile-gender">性别</label>
            <select
              id="profile-gender"
              onChange={(event) => updateFilter("gender", event.target.value)}
              value={filters.gender}
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

        {profiles.length === 0 ? (
          <p className="empty-state">当前没有符合条件的家教信息。</p>
        ) : (
          <div className="record-list">
            {profiles.map((profile) => (
              <article className="record-card" key={profile.id}>
                <div className="record-card-header">
                  <h2>
                    {profile.school} · {profile.major}
                  </h2>
                  <Link className="button secondary" href={`/tutor-profiles/${profile.id}`}>
                    查看详情
                  </Link>
                </div>
                <p>
                  {profile.gender}；可教科目：{profile.subjects.join("、")}；学段：
                  {profile.grades.join("、")}
                </p>
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
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
