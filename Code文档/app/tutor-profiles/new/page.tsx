"use client";

import { FormEvent, useState } from "react";

import { RequireTestSession } from "@/features/auth/require-test-session";
import {
  type TutorProfileInput,
  validateTutorProfileInput
} from "@/features/tutor-profiles/tutor-profile";
import { saveTutorProfile } from "@/features/tutor-profiles/tutor-profile-storage";
import { getBrowserStorage } from "@/lib/storage";

const genderOptions = ["女", "男"];
const schoolOptions = ["东莞理工学院", "广东医科大学", "东莞城市学院", "广东科技学院"];
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
  school: "东莞理工学院",
  major: "",
  subjects: [],
  grades: [],
  timeSlots: [],
  feeRanges: [
    {
      grade: "",
      subject: "",
      min: "",
      max: ""
    }
  ],
  abilityDescription: "",
  proofImages: []
};

function toggleValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function NewTutorProfileForm({ ownerPhone }: { ownerPhone: string }) {
  const [input, setInput] = useState<TutorProfileInput>(initialInput);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [storageError, setStorageError] = useState("");

  function updateInput<K extends keyof TutorProfileInput>(
    field: K,
    value: TutorProfileInput[K]
  ) {
    setInput((current) => ({ ...current, [field]: value }));
    setSaved(false);
    setErrors({});
  }

  function updateFeeRange(
    field: keyof TutorProfileInput["feeRanges"][number],
    value: string
  ) {
    setInput((current) => ({
      ...current,
      feeRanges: [{ ...current.feeRanges[0], [field]: value }]
    }));
    setSaved(false);
    setErrors({});
  }

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateTutorProfileInput(input);
    const storage = getBrowserStorage();

    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

    if (!storage) {
      setStorageError("当前浏览器无法保存家教信息。");
      return;
    }

    const savedProfile = saveTutorProfile({ input, ownerPhone, storage });

    if (!savedProfile.ok) {
      setErrors(savedProfile.errors);
      return;
    }

    setInput(initialInput);
    setErrors({});
    setStorageError("");
    setSaved(true);
  }

  return (
    <section className="content-panel wide-panel">
      <h1 className="section-title">发布家教信息</h1>
      <p>当前测试账号：{ownerPhone}。M2 只记录发布资料和可选证明图片入口，不展示联系方式。</p>

      <form className="form" onSubmit={submitForm}>
        <div className="two-column">
          <div className="field">
            <label htmlFor="gender">性别</label>
            <select
              id="gender"
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

          <div className="field">
            <label htmlFor="school">学校</label>
            <select
              id="school"
              onChange={(event) => updateInput("school", event.target.value)}
              value={input.school}
            >
              {schoolOptions.map((school) => (
                <option key={school} value={school}>
                  {school}
                </option>
              ))}
            </select>
            <span className="error">{errors.school}</span>
          </div>
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

        <div className="fee-range">
          <div className="field">
            <label htmlFor="fee-grade">课时费对应学段</label>
            <select
              id="fee-grade"
              onChange={(event) => updateFeeRange("grade", event.target.value)}
              value={input.feeRanges[0].grade}
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
            <label htmlFor="fee-subject">课时费对应科目</label>
            <select
              id="fee-subject"
              onChange={(event) => updateFeeRange("subject", event.target.value)}
              value={input.feeRanges[0].subject}
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
            <label htmlFor="fee-min">最低课时费</label>
            <input
              id="fee-min"
              inputMode="numeric"
              onChange={(event) => updateFeeRange("min", event.target.value)}
              value={input.feeRanges[0].min}
            />
          </div>
          <div className="field">
            <label htmlFor="fee-max">最高课时费</label>
            <input
              id="fee-max"
              inputMode="numeric"
              onChange={(event) => updateFeeRange("max", event.target.value)}
              value={input.feeRanges[0].max}
            />
          </div>
        </div>
        <span className="error">{errors.feeRanges}</span>

        <div className="field">
          <label htmlFor="ability-description">能力说明</label>
          <textarea
            id="ability-description"
            onChange={(event) => updateInput("abilityDescription", event.target.value)}
            placeholder="可写成绩、证书、擅长科目、过往家教经验，不填写联系方式"
            rows={5}
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
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []).map((file) => ({
                name: file.name,
                type: file.type,
                size: file.size
              }));
              updateInput("proofImages", files);
            }}
            type="file"
          />
          <span className="field-hint">
            可选入口；当前 M2 本地测试仅保存图片名称、类型和大小。
          </span>
          <span className="error">{errors.proofImages}</span>
        </div>

        <button className="button primary" type="submit">
          发布家教信息
        </button>
      </form>

      {storageError ? <p className="error">{storageError}</p> : null}
      {saved ? <p className="success">家教信息已保存到当前测试账号。</p> : null}
    </section>
  );
}

export default function NewTutorProfilePage() {
  return (
    <div className="page">
      <RequireTestSession>
        {(session) => <NewTutorProfileForm ownerPhone={session.phone} />}
      </RequireTestSession>
    </div>
  );
}
