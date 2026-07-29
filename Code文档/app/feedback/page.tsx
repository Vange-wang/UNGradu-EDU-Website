"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";

import type { RiskFeedbackInput } from "@/features/feedback/risk-feedback";
import {
  describeRiskFeedbackStatus,
  validateRiskFeedbackInput
} from "@/features/feedback/risk-feedback";
import {
  listMyRiskFeedbackFromApi,
  submitRiskFeedbackToApi
} from "@/features/feedback/risk-feedback-api-client";
import type {
  PublicRiskFeedbackRecord,
  ServerRiskFeedback
} from "@/server/risk-feedback";

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
  const [savedFeedback, setSavedFeedback] = useState<ServerRiskFeedback | null>(null);
  const [myFeedbackRecords, setMyFeedbackRecords] = useState<
    PublicRiskFeedbackRecord[]
  >([]);
  const [recordsStatus, setRecordsStatus] = useState<
    "loading" | "ready" | "login-required" | "failed"
  >("loading");
  const [status, setStatus] = useState<"idle" | "submitting" | "saved" | "failed">(
    "idle"
  );

  const loadMyFeedbackRecords = useCallback(async () => {
    setRecordsStatus("loading");
    const result = await listMyRiskFeedbackFromApi();

    if (result.ok) {
      setMyFeedbackRecords(result.value);
      setRecordsStatus("ready");
      return;
    }

    const message = result.errors.request ?? "";
    setRecordsStatus(message.includes("登录") ? "login-required" : "failed");
  }, []);

  useEffect(() => {
    void loadMyFeedbackRecords();
  }, [loadMyFeedbackRecords]);

  function updateInput<K extends keyof RiskFeedbackInput>(
    field: K,
    value: RiskFeedbackInput[K]
  ) {
    setInput((current) => ({ ...current, [field]: value }));
    setErrors({});
    setStatus("idle");
    setSavedFeedback(null);
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

    setSavedFeedback(result.value);
    setInput(initialInput);
    setErrors({});
    setStatus("saved");
    await loadMyFeedbackRecords();
  }

  return (
    <div className="page">
      <section className="notice-layout">
        <aside className="notice-aside">
          <span className="eyebrow">风险与功能反馈</span>
          <h1>发现问题，先记录下来。</h1>
          <p>可反馈联系方式滥用、虚假信息、骚扰或功能异常。</p>
          <p>反馈仅用于记录排查，不承诺客服介入、仲裁、退款或担保。</p>
          <p>推荐通过项目方提供的 HTTPS 入口访问；入口变化以项目方通知为准。</p>
          <p>Cloudflare Worker 如被使用，仅作为临时访问与基础安全加固方案。</p>
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
          {status === "saved" && savedFeedback ? (
            <div className="feedback-result success">
              <strong>已记录</strong>
              <p>
                反馈编号：{savedFeedback.id}。平台会用于后续排查，但当前不承诺即时处理、人工仲裁、退款、担保或封禁。
              </p>
              <p>
                当前状态：{describeRiskFeedbackStatus(savedFeedback.status)}。
                {savedFeedback.submittedByUserId
                  ? "登录状态提交的反馈可在本页下方查看状态。"
                  : "匿名反馈后续可能无法查询，请先保存本次编号。"}
              </p>
            </div>
          ) : null}
          {status === "failed" && errors.request ? (
            <p className="error">提交失败，请稍后重试；可先复制保存已填写内容。</p>
          ) : null}
        </form>
      </section>

      <section className="content-panel feedback-record-panel" aria-labelledby="feedback-record-title">
        <div className="section-heading-row">
          <div>
            <span className="eyebrow">我的反馈记录</span>
            <h2 className="section-title" id="feedback-record-title">
              反馈状态
            </h2>
          </div>
        </div>

        {recordsStatus === "loading" ? (
          <p className="empty-state">正在读取反馈记录...</p>
        ) : null}
        {recordsStatus === "login-required" ? (
          <p className="privacy-note">
            未登录提交可完成记录，但后续可能无法查询；登录后提交的反馈会在这里显示状态。
          </p>
        ) : null}
        {recordsStatus === "failed" ? (
          <p className="error">反馈记录读取失败，请稍后刷新重试。</p>
        ) : null}
        {recordsStatus === "ready" && myFeedbackRecords.length === 0 ? (
          <p className="empty-state">当前账号还没有反馈记录。</p>
        ) : null}

        {recordsStatus === "ready" && myFeedbackRecords.length > 0 ? (
          <div className="record-list feedback-record-list">
            {myFeedbackRecords.map((record) => (
              <article className="record-card feedback-record-card" key={record.id}>
                <div className="record-card-header">
                  <div>
                    <h3>{record.category}</h3>
                    <p>
                      {record.targetType}
                      {record.targetReference ? ` / ${record.targetReference}` : ""}
                    </p>
                  </div>
                  <span className="status-pill">
                    {describeRiskFeedbackStatus(record.status)}
                  </span>
                </div>
                <p>{record.description.slice(0, 120)}</p>
                <p className="field-hint">
                  提交时间：{new Date(record.createdAt).toLocaleString("zh-CN")}
                </p>
              </article>
            ))}
          </div>
        ) : null}

        <p className="privacy-note">
          反馈状态只表示记录进度，不代表平台承诺即时客服、人工仲裁、退款、担保、认证或封禁处理。
        </p>
      </section>
    </div>
  );
}
