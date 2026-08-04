"use client";

import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

import { RequireTestSession } from "@/features/auth/require-test-session";
import {
  type TutorProfileInput,
  validateTutorProfileInput
} from "@/features/tutor-profiles/tutor-profile";
import {
  readMyTutorProfileFromApi,
  saveTutorProfileToApi,
  updateTutorProfileToApi
} from "@/features/tutor-profiles/tutor-profile-api-client";

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
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit")?.trim() ?? "";
  const [input, setInput] = useState<TutorProfileInput>(initialInput);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [saved, setSaved] = useState(false);
  const [submissionReady, setSubmissionReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [version, setVersion] = useState<number | null>(null);
  const submissionLock = useRef(false);

  useEffect(() => {
    setSubmissionReady(true);
  }, []);

  useEffect(() => {
    if (!editId) {
      return;
    }

    let cancelled = false;
    setVersion(null);
    setSaved(false);
    setErrors({});

    void readMyTutorProfileFromApi({ currentUserPhone: ownerPhone, id: editId })
      .then((result) => {
        if (cancelled) return;

        if (!result.ok) {
          setErrors(result.errors);
          return;
        }

        if (result.value.managementState !== "managed" || result.value.status !== "published") {
          setErrors({ request: "该记录当前不可编辑，请返回我的家教信息查看状态。" });
          return;
        }

        setInput({
          gender: result.value.gender,
          school: result.value.school,
          major: result.value.major,
          subjects: result.value.subjects,
          grades: result.value.grades,
          timeSlots: result.value.timeSlots,
          feeRanges: result.value.feeRanges.map((range) => ({
            ...range,
            min: String(range.min),
            max: String(range.max)
          })),
          abilityDescription: result.value.abilityDescription,
          proofImages: result.value.proofImages
        });
        setVersion(result.value.version);
      });

    return () => {
      cancelled = true;
    };
  }, [editId, ownerPhone]);

  function updateInput<K extends keyof TutorProfileInput>(
    field: K,
    value: TutorProfileInput[K]
  ) {
    setInput((current) => ({ ...current, [field]: value }));
    setSaved(false);
    setSubmitError("");
    setErrors((current) =>
      editId && version === null && current.request
        ? { request: current.request }
        : {}
    );
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

    if (!submissionReady || submissionLock.current) {
      return;
    }

    if (editId && version === null) {
      setErrors((current) => ({
        ...current,
        request: current.request ?? "编辑记录尚未安全加载，暂不能保存。"
      }));
      return;
    }

    const validation = validateTutorProfileInput(input);

    if (!validation.ok) {
      setErrors(validation.errors);
      return;
    }

    submissionLock.current = true;
    setSubmitting(true);
    setSubmitError("");
    setSaved(false);

    try {
      const result = editId
        ? await updateTutorProfileToApi({
            currentUserPhone: ownerPhone,
            id: editId,
            input,
            version: version as number
          })
        : await saveTutorProfileToApi({ currentUserPhone: ownerPhone, input });

      if (!result.ok) {
        setErrors(result.errors);
        setSubmitError(result.errors.request ?? "家教信息提交失败，请稍后重试。");
        return;
      }

      if (editId) {
        setVersion(result.value.version);
      } else {
        setInput(initialInput);
      }
      setErrors({});
      setSaved(true);
    } catch {
      const message = "家教信息提交失败，请稍后重试。";
      setErrors({ request: message });
      setSubmitError(message);
    } finally {
      submissionLock.current = false;
      setSubmitting(false);
    }
  }

  return (
    <section className="wide-panel">
      <div className="publish-hero">
        <div className="publish-copy">
          <span className="eyebrow">{editId ? "编辑资料" : "发布资料"}</span>
          <h1 className="section-title">{editId ? "编辑家教信息" : "发布家教信息"}</h1>
          <p>{editId ? "保存时会校验最新版本，避免覆盖其他修改。" : "填写学校专业、可教范围和课时费；公开说明不要写联系方式。"}</p>
        </div>
      </div>

      {errors.request && !submitError ? (
        <p aria-live="assertive" className="privacy-note error" role="alert">
          {errors.request}
        </p>
      ) : null}

      <div className="step-form-layout">
        <aside className="step-rail" aria-label="发布家教信息填写步骤">
          <div>
            <span className="eyebrow">分步填写</span>
            <h2>把资料整理成可读档案</h2>
          </div>
          <p>可添加多组学段、科目和课时费。</p>
          <p className="rail-note">
            公开资料不写联系方式或精确住址。
          </p>
          <ol className="step-list">
            <li className="step-item">
              <span>1</span>
              <div>
                <strong>学校专业</strong>
                <small>学校和专业</small>
              </div>
            </li>
            <li className="step-item">
              <span>2</span>
              <div>
                <strong>可教范围</strong>
                <small>科目和时间</small>
              </div>
            </li>
            <li className="step-item">
              <span>3</span>
              <div>
                <strong>课时费组</strong>
                <small>可新增</small>
              </div>
            </li>
            <li className="step-item">
              <span>4</span>
              <div>
                <strong>证明与说明</strong>
                <small>说明不含联系方式</small>
              </div>
            </li>
          </ol>
        </aside>

        <form className="step-form" onSubmit={submitForm}>
          <section className="form-section">
            <div className="form-section-heading">
              <div className="form-section-title-row">
                <span className="form-section-number">01</span>
                <h2>学校专业</h2>
              </div>
              <p>填写学校、专业和基础信息。</p>
            </div>

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
          </section>

          <section className="form-section">
            <div className="form-section-heading">
              <div className="form-section-title-row">
                <span className="form-section-number">02</span>
                <h2>可教范围</h2>
              </div>
              <p>选择可教科目、学段和时间。</p>
            </div>

            <fieldset className="field option-field">
              <legend>可教科目</legend>
              <div className="choice-grid">
                {subjectOptions.map((subject) => (
                  <label key={subject} className="choice-item">
                    <input
                      checked={input.subjects.includes(subject)}
                      onChange={() =>
                        updateInput("subjects", toggleValue(input.subjects, subject))
                      }
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
          </section>

          <section className="form-section">
            <div className="form-section-heading">
              <div className="form-section-title-row">
                <span className="form-section-number">03</span>
                <h2>课时费组</h2>
              </div>
              <p>填写学段、科目和课时费区间。</p>
            </div>

            <fieldset className="field option-field">
              <legend>学段与课时费</legend>
              <div className="fee-range-list">
                {input.feeRanges.map((range, index) => (
                  <div className="fee-range fee-range-card" key={index}>
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
          </section>

          <section className="form-section">
            <div className="form-section-heading">
              <div className="form-section-title-row">
                <span className="form-section-number">04</span>
                <h2>证明与能力说明</h2>
              </div>
              <p>能力说明不要填写联系方式。</p>
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
                当前不会公开展示或审核证明图片。
              </span>
              <span className="error">{errors.proofImages}</span>
            </div>

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

            <p className="privacy-note">
              公开资料不要写手机号、微信号或精确住址；联系方式需双方确认后交换。
            </p>
          </section>

          <section className="submit-section">
            <button
              className="button primary"
              data-submit-action
              disabled={
                !submissionReady ||
                submitting ||
                (Boolean(editId) && version === null)
              }
              type="submit"
            >
              {submitting ? "提交中..." : editId ? "保存修改" : "发布家教信息"}
            </button>
            {submitError ? (
              <p aria-live="assertive" className="error" role="alert">
                {submitError}
              </p>
            ) : null}
            {saved ? <p aria-live="polite" className="success" role="status">{editId ? "家教信息已更新。" : "家教信息已发布。"}</p> : null}
          </section>
        </form>
      </div>
    </section>
  );
}

export default function NewTutorProfilePage() {
  return (
    <div className="page dplus-business-page">
      <RequireTestSession>
        {(session) => <NewTutorProfileForm ownerPhone={session.userId ?? session.phone ?? ""} />}
      </RequireTestSession>
    </div>
  );
}
