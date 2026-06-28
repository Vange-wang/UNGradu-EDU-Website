"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

import { RequireTestSession } from "@/features/auth/require-test-session";
import {
  type TutorProfileInput,
  validateTutorProfileInput
} from "@/features/tutor-profiles/tutor-profile";
import { saveTutorProfileToApi } from "@/features/tutor-profiles/tutor-profile-api-client";

const genderOptions = ["女", "男"];
const subjectOptions = ["语文", "数学", "英语", "物理", "化学", "生物"];
const gradeOptions = ["小学", "初中", "高中"];
const timeSlotOptions = [
  "周一晚上",
  "周二晚上",
  "周三晚上",
  "周四晚上",
  "周五晚上",
  "周六上午",
  "周六下午",
  "周日上午",
  "周日下午",
  "周日晚上"
];

const initialInput: TutorProfileInput = {
  gender: "女",
  school: "",
  major: "",
  subjects: [],
  grades: [],
  timeSlots: [],
  feeRanges: [{ grade: "", subject: "", min: "", max: "" }],
  abilityDescription: "",
  proofImages: []
};

function createEmptyFeeRange() {
  return { grade: "", subject: "", min: "", max: "" };
}

function toggleValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function NewTutorProfileForm({ ownerPhone }: { ownerPhone: string }) {
  const [input, setInput] = useState<TutorProfileInput>(initialInput);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [saved, setSaved] = useState(false);

  function updateInput<K extends keyof TutorProfileInput>(
    field: K,
    value: TutorProfileInput[K]
  ) {
    setInput((current) => ({ ...current, [field]: value }));
    setSaved(false);
    setErrors({});
  }

  function updateFeeRange(
    index: number,
    field: "grade" | "subject" | "min" | "max",
    value: string
  ) {
    updateInput(
      "feeRanges",
      input.feeRanges.map((range, rangeIndex) =>
        rangeIndex === index ? { ...range, [field]: value } : range
      )
    );
  }

  function addFeeRange() {
    updateInput("feeRanges", [...input.feeRanges, createEmptyFeeRange()]);
  }

  function removeFeeRange(index: number) {
    if (input.feeRanges.length === 1) {
      return;
    }

    updateInput(
      "feeRanges",
      input.feeRanges.filter((_, rangeIndex) => rangeIndex !== index)
    );
  }

  function updateProofImages(files: FileList | null) {
    updateInput(
      "proofImages",
      Array.from(files ?? []).map((file) => ({
        name: file.name,
        type: file.type,
        size: file.size
      }))
    );
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateTutorProfileInput(input);

    if (!validation.ok) {
      setErrors(validation.errors);
      return;
    }

    const result = await saveTutorProfileToApi({
      currentUserPhone: ownerPhone,
      input
    });

    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

    setInput(initialInput);
    setErrors({});
    setSaved(true);
  }

  return (
    <section className="content-panel wide-panel">
      <div className="section-heading-row">
        <div>
          <h1 className="section-title">发布家教信息</h1>
          <p>填写可教科目、可教学段和课时费规则，发布后家长可在广场中查看。</p>
        </div>
        <Link className="button secondary" href="/profile/tutor-profiles">
          返回我的家教信息
        </Link>
      </div>

      <form className="form" onSubmit={submitForm}>
        <div className="field">
          <label htmlFor="tutor-gender">性别</label>
          <select
            id="tutor-gender"
            onChange={(event) => updateInput("gender", event.target.value)}
            value={input.gender}
          >
            {genderOptions.map((gender) => (
              <option key={gender} value={gender}>
                {gender}
              </option>
            ))}
          </select>
          <span className="error">{errors.gender}</span>
        </div>

        <div className="two-column">
          <div className="field">
            <label htmlFor="school">学校</label>
            <input
              id="school"
              onChange={(event) => updateInput("school", event.target.value)}
              value={input.school}
            />
            <span className="error">{errors.school}</span>
          </div>
          <div className="field">
            <label htmlFor="major">专业</label>
            <input
              id="major"
              onChange={(event) => updateInput("major", event.target.value)}
              value={input.major}
            />
            <span className="error">{errors.major}</span>
          </div>
        </div>

        <fieldset className="field option-field">
          <legend>可教科目</legend>
          <div className="choice-grid">
            {subjectOptions.map((subject) => (
              <label key={subject} className="choice-item">
                <input
                  checked={input.subjects.includes(subject)}
                  onChange={() => updateInput("subjects", toggleValue(input.subjects, subject))}
                  type="checkbox"
                />
                {subject}
              </label>
            ))}
          </div>
          <span className="error">{errors.subjects}</span>
        </fieldset>

        <fieldset className="field option-field">
          <legend>可教学段</legend>
          <div className="choice-grid">
            {gradeOptions.map((grade) => (
              <label key={grade} className="choice-item">
                <input
                  checked={input.grades.includes(grade)}
                  onChange={() => updateInput("grades", toggleValue(input.grades, grade))}
                  type="checkbox"
                />
                {grade}
              </label>
            ))}
          </div>
          <span className="error">{errors.grades}</span>
        </fieldset>

        <fieldset className="field option-field">
          <legend>可上课时间段</legend>
          <div className="choice-grid">
            {timeSlotOptions.map((timeSlot) => (
              <label key={timeSlot} className="choice-item">
                <input
                  checked={input.timeSlots.includes(timeSlot)}
                  onChange={() =>
                    updateInput("timeSlots", toggleValue(input.timeSlots, timeSlot))
                  }
                  type="checkbox"
                />
                {timeSlot}
              </label>
            ))}
          </div>
          <span className="error">{errors.timeSlots}</span>
        </fieldset>

        <fieldset className="field option-field">
          <legend>学段与课时费</legend>
          <div className="fee-range-list">
            {input.feeRanges.map((range, index) => (
              <div className="fee-range" key={index}>
                <div className="field">
                  <label htmlFor={`fee-grade-${index}`}>学段</label>
                  <select
                    id={`fee-grade-${index}`}
                    onChange={(event) =>
                      updateFeeRange(index, "grade", event.target.value)
                    }
                    value={range.grade}
                  >
                    <option value="">请选择</option>
                    {gradeOptions.map((grade) => (
                      <option key={grade} value={grade}>
                        {grade}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor={`fee-subject-${index}`}>科目</label>
                  <select
                    id={`fee-subject-${index}`}
                    onChange={(event) =>
                      updateFeeRange(index, "subject", event.target.value)
                    }
                    value={range.subject}
                  >
                    <option value="">请选择</option>
                    {subjectOptions.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor={`fee-min-${index}`}>最低课时费</label>
                  <input
                    id={`fee-min-${index}`}
                    inputMode="numeric"
                    onChange={(event) => updateFeeRange(index, "min", event.target.value)}
                    value={range.min}
                  />
                </div>
                <div className="field">
                  <label htmlFor={`fee-max-${index}`}>最高课时费</label>
                  <input
                    id={`fee-max-${index}`}
                    inputMode="numeric"
                    onChange={(event) => updateFeeRange(index, "max", event.target.value)}
                    value={range.max}
                  />
                </div>
                <button
                  className="button secondary fee-remove-button"
                  disabled={input.feeRanges.length === 1}
                  onClick={() => removeFeeRange(index)}
                  type="button"
                >
                  删除
                </button>
              </div>
            ))}
          </div>
          <button className="button secondary" onClick={addFeeRange} type="button">
            + 新增一组学段与课时费
          </button>
        </fieldset>
        <span className="error">{errors.feeRanges}</span>

        <div className="field">
          <label htmlFor="ability-description">能力说明</label>
          <textarea
            id="ability-description"
            onChange={(event) => updateInput("abilityDescription", event.target.value)}
            placeholder="说明教学优势，不填写手机号或微信号"
            rows={4}
            value={input.abilityDescription}
          />
          <span className="error">{errors.abilityDescription}</span>
        </div>

        <div className="field">
          <label htmlFor="proof-images">证明图片</label>
          <input
            accept="image/jpeg,image/png,image/webp"
            id="proof-images"
            multiple
            onChange={(event) => updateProofImages(event.target.files)}
            type="file"
          />
          <span className="field-hint">
            当前仅保存文件名、类型和大小，不提供正式证明图片上传、查看或审核能力。
          </span>
          <span className="error">{errors.proofImages}</span>
        </div>

        <button className="button primary" type="submit">
          发布家教信息
        </button>
      </form>

      {saved ? <p className="success">家教信息已发布。</p> : null}
    </section>
  );
}

export default function NewTutorProfilePage() {
  return (
    <div className="page">
      <RequireTestSession>
        {(session) => <NewTutorProfileForm ownerPhone={session.userId ?? session.phone ?? ""} />}
      </RequireTestSession>
    </div>
  );
}
