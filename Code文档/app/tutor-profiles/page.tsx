"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { formatTutorFeeRange } from "@/features/tutor-profiles/tutor-profile";
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
    <div className="page">
      <section className="content-panel wide-panel">
        <div className="section-heading-row">
          <div>
            <h1 className="section-title">家教信息广场</h1>
            <p>按科目、学段、课时费和性别筛选大学生家教信息；公开详情不展示联系方式。</p>
          </div>
          <div className="action-row compact-actions">
            <Link className="button secondary" href="/">
              返回首页
            </Link>
            <Link className="button primary" href="/tutor-profiles/new">
              发布家教信息
            </Link>
          </div>
        </div>

        <form className="filter-bar" onSubmit={applyFilters}>
          <div className="field">
            <label htmlFor="tutor-subject">科目</label>
            <select
              id="tutor-subject"
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
            <label htmlFor="tutor-grade">学段</label>
            <select
              id="tutor-grade"
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
            <label htmlFor="tutor-fee-min">课时费下限</label>
            <input
              id="tutor-fee-min"
              inputMode="numeric"
              onChange={(event) => updateFilter("feeMin", event.target.value)}
              value={filters.feeMin}
            />
          </div>

          <div className="field">
            <label htmlFor="tutor-fee-max">课时费上限</label>
            <input
              id="tutor-fee-max"
              inputMode="numeric"
              onChange={(event) => updateFilter("feeMax", event.target.value)}
              value={filters.feeMax}
            />
          </div>

          <div className="field">
            <label htmlFor="tutor-gender">性别</label>
            <select
              id="tutor-gender"
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
                <p>性别：{profile.gender}</p>
                <p>可教科目：{profile.subjects.join("、")}</p>
                <p>可教学段：{profile.grades.join("、")}</p>
                <p>
                  课时费：
                  {profile.feeRanges
                    .map((range) => formatTutorFeeRange(range))
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
