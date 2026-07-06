"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";

import type { RiskFeedbackInput } from "@/features/feedback/risk-feedback";
import { validateRiskFeedbackInput } from "@/features/feedback/risk-feedback";
import { submitRiskFeedbackToApi } from "@/features/feedback/risk-feedback-api-client";

const categoryOptions = ["联系方式滥用", "虚假信息", "骚扰", "付款风险", "功能异常", "其他"];
const targetTypeOptions = ["需求", "家教信息", "聊天", "联系方式", "其他 / 不确定"];

const initialInput: RiskFeedbackInput = {
  category: "",
  targetType: "",
  targetReference: "",
  description: "",
  evidenceNote: "",
  contactMethod: "",
  sourcePage: "/feedback"
};

export default function FeedbackPage() {
  const [input, setInput] = useState<RiskFeedbackInput>(initialInput);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "saved" | "failed">(
    "idle"
  );

  function updateInput<K extends keyof RiskFeedbackInput>(
    field: K,
    value: RiskFeedbackInput[K]
  ) {
    setInput((current) => ({ ...current, [field]: value }));
    setErrors({});
    setStatus("idle");
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      ...input,
      sourcePage: window.location.pathname || "/feedback"
    };
    const validation = validateRiskFeedbackInput(payload);

    if (!validation.ok) {
      setErrors(validation.errors);
      setStatus("failed");
      return;
    }

    setStatus("submitting");
    const result = await submitRiskFeedbackToApi({ input: validation.value });

    if (!result.ok) {
      setErrors(result.errors);
      setStatus("failed");
      return;
    }

    setInput(initialInput);
    setErrors({});
    setStatus("saved");
  }

  return (
    <div className="page">
      <section className="notice-layout">
        <aside className="notice-aside">
          <span className="eyebrow">风险与功能反馈</span>
          <h1>发现问题，先记录下来。</h1>
          <p>可反馈联系方式滥用、虚假信息、骚扰或功能异常。</p>
          <p>反馈仅用于记录排查，不承诺客服介入、仲裁、退款或担保。</p>
          <Link className="button secondary" href="/">
            返回首页
          </Link>
        </aside>

        <form className="notice-panel dplus-notice-list" onSubmit={submitForm}>
          <div className="notice-item notice-item-strong">
            <h2>提交风险反馈</h2>
            <p>可匿名提交；联系方式选填，便于后续核实。</p>
          </div>

          <div className="two-column">
            <div className="field">
              <label htmlFor="feedback-category">反馈类型</label>
              <select
                id="feedback-category"
                onChange={(event) => updateInput("category", event.target.value)}
                value={input.category}
              >
                <option value="">请选择</option>
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <span className="error">{errors.category}</span>
            </div>

            <div className="field">
              <label htmlFor="feedback-target-type">反馈对象</label>
              <select
                id="feedback-target-type"
                onChange={(event) => updateInput("targetType", event.target.value)}
                value={input.targetType}
              >
                <option value="">请选择</option>
                {targetTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <span className="error">{errors.targetType}</span>
            </div>
          </div>

          <div className="field">
            <label htmlFor="feedback-target-reference">相关链接或对象</label>
            <input
              id="feedback-target-reference"
              onChange={(event) => updateInput("targetReference", event.target.value)}
              placeholder="可填写页面链接、聊天或资料线索"
              value={input.targetReference}
            />
            <span className="error">{errors.targetReference}</span>
          </div>

          <div className="field">
            <label htmlFor="feedback-description">问题描述</label>
            <textarea
              id="feedback-description"
              maxLength={1000}
              onChange={(event) => updateInput("description", event.target.value)}
              placeholder="说明发生了什么，不提交证件、支付凭证或完整联系方式"
              rows={5}
              value={input.description}
            />
            <span className="field-hint">{input.description.length}/1000</span>
            <span className="error">{errors.description}</span>
          </div>

          <div className="field">
            <label htmlFor="feedback-evidence">证据说明</label>
            <textarea
              id="feedback-evidence"
              maxLength={500}
              onChange={(event) => updateInput("evidenceNote", event.target.value)}
              placeholder="可选：说明已保存的截图或聊天线索"
              rows={3}
              value={input.evidenceNote}
            />
            <span className="field-hint">{input.evidenceNote.length}/500</span>
            <span className="error">{errors.evidenceNote}</span>
          </div>

          <div className="field">
            <label htmlFor="feedback-contact">可联系信息</label>
            <input
              id="feedback-contact"
              onChange={(event) => updateInput("contactMethod", event.target.value)}
              placeholder="选填：邮箱或站内可核实线索"
              value={input.contactMethod}
            />
            <span className="error">{errors.contactMethod}</span>
          </div>

          <p className="privacy-note">
            不要提交证件、支付凭证、完整联系方式等敏感信息。
          </p>

          <button className="button primary" disabled={status === "submitting"} type="submit">
            {status === "submitting" ? "提交中..." : "提交风险反馈"}
          </button>
          {status === "saved" ? (
            <p className="success">
              已记录反馈。平台会用于后续排查，但当前不承诺即时处理或人工仲裁。
            </p>
          ) : null}
          {status === "failed" && errors.request ? (
            <p className="error">提交失败，请稍后重试；可先复制保存已填写内容。</p>
          ) : null}
        </form>
      </section>
    </div>
  );
}
