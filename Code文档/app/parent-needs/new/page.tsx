"use client";

import { FormEvent, useState } from "react";

import { RequireTestSession } from "@/features/auth/require-test-session";
import {
  type ParentNeedInput,
  validateParentNeedInput
} from "@/features/parent-needs/parent-need";
import { saveParentNeedToApi } from "@/features/parent-needs/parent-need-api-client";

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
  const [input, setInput] = useState<ParentNeedInput>(initialInput);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [saved, setSaved] = useState(false);

  function updateInput<K extends keyof ParentNeedInput>(
    field: K,
    value: ParentNeedInput[K]
  ) {
    setInput((current) => ({ ...current, [field]: value }));
    setSaved(false);
    setErrors({});
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateParentNeedInput(input);

    if (!validation.ok) {
      setErrors(validation.errors);
      return;
    }

    const result = await saveParentNeedToApi({
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
      <h1 className="section-title">发布家教需求</h1>
      <p>当前测试账号：{ownerPhone}。需求会保存到服务端 parent_needs。</p>

      <form className="form" onSubmit={submitForm}>
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
                  onChange={() => updateInput("subjects", toggleValue(input.subjects, subject))}
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

        <button className="button primary" type="submit">
          发布家教需求
        </button>
      </form>

      {saved ? <p className="success">家长需求已保存到服务端。</p> : null}
    </section>
  );
}

export default function NewParentNeedPage() {
  return (
    <div className="page">
      <RequireTestSession>
        {(session) => <NewParentNeedForm ownerPhone={session.phone} />}
      </RequireTestSession>
    </div>
  );
}
