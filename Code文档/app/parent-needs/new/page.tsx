"use client";

import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

import { RequireTestSession } from "@/features/auth/require-test-session";
import {
  type ParentNeedInput,
  validateParentNeedInput
} from "@/features/parent-needs/parent-need";
import {
  readMyParentNeedFromApi,
  saveParentNeedToApi,
  updateParentNeedToApi
} from "@/features/parent-needs/parent-need-api-client";

const teacherGenderOptions = ["不限", "女老师", "男老师"];
const subjectOptions = ["语文", "数学", "英语", "物理", "化学", "生物"];
const gradeOptions = ["小学一至三年级", "小学四至六年级", "初一", "初二", "初三", "高中"];
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
const districtOptions = ["松山湖", "大岭山", "寮步", "东城"];

const initialInput: ParentNeedInput = {
  teacherGenderPreference: "不限",
  subjects: [],
  grade: "",
  budgetMin: "",
  budgetMax: "",
  timeSlots: [],
  region: {
    province: "广东省",
    city: "东莞市",
    district: "松山湖"
  },
  community: "",
  childIntro: ""
};

function toggleValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function NewParentNeedForm({ ownerPhone }: { ownerPhone: string }) {
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit")?.trim() ?? "";
  const [input, setInput] = useState<ParentNeedInput>(initialInput);
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
      setInput(initialInput);
      setErrors({});
      setSaved(false);
      setSubmitError("");
      setVersion(null);
      return;
    }

    let cancelled = false;
    setVersion(null);
    setSaved(false);
    setErrors({});

    void readMyParentNeedFromApi({ currentUserPhone: ownerPhone, id: editId })
      .then((result) => {
        if (cancelled) return;

        if (!result.ok) {
          setErrors(result.errors);
          return;
        }

        if (result.value.managementState !== "managed" || result.value.status !== "published") {
          setErrors({ request: "该记录当前不可编辑，请返回我的需求查看状态。" });
          return;
        }

        setInput({
          teacherGenderPreference: result.value.teacherGenderPreference,
          subjects: result.value.subjects,
          grade: result.value.grade,
          budgetMin: String(result.value.budgetMin),
          budgetMax: String(result.value.budgetMax),
          timeSlots: result.value.timeSlots,
          region: result.value.region,
          community: result.value.community,
          childIntro: result.value.childIntro
        });
        setVersion(result.value.version);
      })
      .catch(() => {
        if (cancelled) return;
        setErrors({ request: "原家教需求加载失败，请返回我的需求后重试。" });
      });

    return () => {
      cancelled = true;
    };
  }, [editId, ownerPhone]);

  function updateInput<K extends keyof ParentNeedInput>(
    field: K,
    value: ParentNeedInput[K]
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

    const validation = validateParentNeedInput(input);

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
        ? await updateParentNeedToApi({
            currentUserPhone: ownerPhone,
            id: editId,
            input,
            version: version as number
          })
        : await saveParentNeedToApi({ currentUserPhone: ownerPhone, input });

      if (!result.ok) {
        setErrors(result.errors);
        setSubmitError(result.errors.request ?? "家教需求提交失败，请稍后重试。");
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
      const message = "家教需求提交失败，请稍后重试。";
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
          <span className="eyebrow">{editId ? "编辑需求" : "发布需求"}</span>
          <h1 className="section-title">{editId ? "编辑家教需求" : "发布家教需求"}</h1>
          <p>{editId ? "保存时会校验最新版本，避免覆盖其他修改。" : "填写孩子情况、科目、预算和时间；公开说明不要写联系方式。"}</p>
        </div>
      </div>

      {errors.request && !submitError ? (
        <p aria-live="assertive" className="privacy-note error" role="alert">
          {errors.request}
        </p>
      ) : null}

      {editId && version === null ? (
        errors.request ? null : (
          <p aria-live="polite" className="empty-state" role="status">
            正在加载原家教需求...
          </p>
        )
      ) : (
      <div className="step-form-layout">
        <aside className="step-rail" aria-label="发布需求填写步骤">
          <div>
            <span className="eyebrow">分步填写</span>
            <h2>把需求拆成四件小事</h2>
          </div>
          <p>写清学习情况和上课安排即可。</p>
          <p className="rail-note">
            不写手机号、微信号或精确门牌号。
          </p>
          <ol className="step-list">
            <li className="step-item">
              <span>1</span>
              <div>
                <strong>基础信息</strong>
                <small>偏好、科目、年级</small>
              </div>
            </li>
            <li className="step-item">
              <span>2</span>
              <div>
                <strong>预算时间</strong>
                <small>预算和时间</small>
              </div>
            </li>
            <li className="step-item">
              <span>3</span>
              <div>
                <strong>区域位置</strong>
                <small>小区或村</small>
              </div>
            </li>
            <li className="step-item">
              <span>4</span>
              <div>
                <strong>隐私提示</strong>
                <small>不写联系方式</small>
              </div>
            </li>
          </ol>
        </aside>

        <form className="step-form" onSubmit={submitForm}>
          <section className="form-section">
            <div className="form-section-heading">
              <div className="form-section-title-row">
                <span className="form-section-number">01</span>
                <h2>基础信息</h2>
              </div>
              <p>选择老师偏好、科目和年级。</p>
            </div>

            <div className="field">
              <label htmlFor="teacher-gender">希望老师性别</label>
              <select
                id="teacher-gender"
                onChange={(event) =>
                  updateInput("teacherGenderPreference", event.target.value)
                }
                value={input.teacherGenderPreference}
              >
                {teacherGenderOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <span className="error">{errors.teacherGenderPreference}</span>
            </div>

            <fieldset className="field option-field">
              <legend>所需科目</legend>
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

            <div className="field">
              <label htmlFor="grade">学段/年级</label>
              <select
                id="grade"
                onChange={(event) => updateInput("grade", event.target.value)}
                value={input.grade}
              >
                <option value="">请选择</option>
                {gradeOptions.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
              <span className="error">{errors.grade}</span>
            </div>
          </section>

          <section className="form-section">
            <div className="form-section-heading">
              <div className="form-section-title-row">
                <span className="form-section-number">02</span>
                <h2>预算与时间</h2>
              </div>
              <p>填写课时预算和可上课时间。</p>
            </div>

            <div className="two-column">
              <div className="field">
                <label htmlFor="budget-min">预算最低值（元/小时）</label>
                <input
                  id="budget-min"
                  inputMode="numeric"
                  onChange={(event) => updateInput("budgetMin", event.target.value)}
                  value={input.budgetMin}
                />
              </div>
              <div className="field">
                <label htmlFor="budget-max">预算最高值（元/小时）</label>
                <input
                  id="budget-max"
                  inputMode="numeric"
                  onChange={(event) => updateInput("budgetMax", event.target.value)}
                  value={input.budgetMax}
                />
              </div>
            </div>
            <span className="error">{errors.budget}</span>

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
                <h2>区域与隐私</h2>
              </div>
              <p>位置填到小区或村即可。</p>
            </div>

            <div className="two-column">
              <div className="field">
                <label htmlFor="district">地址区域</label>
                <select
                  id="district"
                  onChange={(event) =>
                    updateInput("region", {
                      ...input.region,
                      district: event.target.value
                    })
                  }
                  value={input.region.district}
                >
                  {districtOptions.map((district) => (
                    <option key={district} value={district}>
                      广东省 / 东莞市 / {district}
                    </option>
                  ))}
                </select>
                <span className="error">{errors.region}</span>
              </div>
              <div className="field">
                <label htmlFor="community">具体位置</label>
                <input
                  id="community"
                  onChange={(event) => updateInput("community", event.target.value)}
                  placeholder="最多填写到小区或村"
                  value={input.community}
                />
                <span className="error">{errors.community}</span>
              </div>
            </div>

            <div className="field">
              <label htmlFor="child-intro">孩子简介</label>
              <textarea
                id="child-intro"
                maxLength={120}
                onChange={(event) => updateInput("childIntro", event.target.value)}
                placeholder="100 字以内，不填写手机号、微信号或门牌号"
                required
                rows={4}
                value={input.childIntro}
              />
              <span className="field-hint">{input.childIntro.length}/100</span>
              <span className="error">{errors.childIntro}</span>
            </div>

            <p className="privacy-note">
              公开说明不要写手机号、微信号或精确住址；联系方式需双方确认后交换。
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
              {submitting ? "提交中..." : editId ? "保存修改" : "发布家教需求"}
            </button>
            {submitError ? (
              <p aria-live="assertive" className="error" role="alert">
                {submitError}
              </p>
            ) : null}
            {saved ? <p aria-live="polite" className="success" role="status">{editId ? "家教需求已更新。" : "家教需求已发布。"}</p> : null}
          </section>
        </form>
      </div>
      )}
    </section>
  );
}

export default function NewParentNeedPage() {
  return (
    <div className="page dplus-business-page">
      <RequireTestSession>
        {(session) => <NewParentNeedForm ownerPhone={session.userId ?? session.phone ?? ""} />}
      </RequireTestSession>
    </div>
  );
}
