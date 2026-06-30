import Link from "next/link";

import { GuardedEntryLink } from "@/features/auth/guarded-entry-link";

const steps = [
  ["发布信息", "家长发布需求，大学生发布个人家教信息。"],
  ["筛选详情", "双方按科目、学段、价格和性别查看合适对象。"],
  ["站内沟通", "先通过基础文字聊天确认具体上课情况。"],
  ["双向同意", "二次确认后才展示双方存档联系方式。"]
];

export default function HomePage() {
  return (
    <div className="page">
      <section className="gateway-hero">
        <div className="gateway-layout">
          <div className="hero-copy">
            <span className="eyebrow">东莞大学城 · 自助撮合</span>
            <h1>家教对接</h1>
            <p>
              面向本地家教供需的自助撮合平台。先用发布、筛选、聊天和双向同意交换联系方式，
              把找老师与做家教这条闭环跑顺。
            </p>
            <div className="gateway-entry-grid" aria-label="身份入口">
              <div className="gateway-entry parent-entry">
                <span>找家教</span>
                <strong>发布补课需求</strong>
                <small>填写学段、科目、预算和上课偏好</small>
                <GuardedEntryLink className="button primary full-width" href="/parent-needs/new">
                  我要找家教
                </GuardedEntryLink>
              </div>
              <div className="gateway-entry tutor-entry">
                <span>做家教</span>
                <strong>发布家教信息</strong>
                <small>展示可教科目、时间和课时费范围</small>
                <GuardedEntryLink className="button primary full-width" href="/tutor-profiles/new">
                  我要做家教
                </GuardedEntryLink>
              </div>
            </div>
            <div className="action-row">
              <Link className="button secondary" href="/parent-needs">
                浏览需求广场
              </Link>
              <Link className="button secondary" href="/tutor-profiles">
                浏览家教信息
              </Link>
              <GuardedEntryLink className="button secondary" href="/profile">
                个人页
              </GuardedEntryLink>
            </div>
          </div>

          <div className="gateway-status-panel" aria-label="平台边界">
            <span className="eyebrow">当前版本</span>
            <h2>MVP 小范围试运行</h2>
            <p>
              平台当前提供信息发布、站内沟通和双方同意后的联系方式交换；不做支付、担保、认证或人工仲裁。
            </p>
            <div className="status-strip">
              <span>公开页不展示联系方式</span>
              <span>交换前二次确认</span>
              <span>风险反馈仅记录排查</span>
            </div>
          </div>
        </div>
      </section>

      <section className="process-band" aria-labelledby="process-title">
        <div className="section-heading-row">
          <div>
            <span className="eyebrow">使用流程</span>
            <h2 className="section-title" id="process-title">
              先沟通，再交换联系方式
            </h2>
          </div>
          <Link className="button secondary" href="/rules">
            查看规则
          </Link>
        </div>
        <ol className="flow-list flow-list-dark">
          {steps.map(([title, description], index) => (
            <li key={title}>
              <span className="step-number">{index + 1}</span>
              <span>
                <strong>{title}</strong>
                <span>{description}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="entry-title">
        <div className="section-heading-row">
          <div>
            <span className="eyebrow">浏览入口</span>
            <h2 className="section-title" id="entry-title">
              从广场开始筛选
            </h2>
          </div>
        </div>
        <div className="grid">
          <Link className="feature-card" href="/parent-needs">
            <h3>需求广场</h3>
            <p>大学生浏览家长需求，按科目、学段、预算和性别偏好筛选。</p>
          </Link>
          <Link className="feature-card" href="/tutor-profiles">
            <h3>家教信息广场</h3>
            <p>家长浏览大学生家教信息，查看可教科目、学段和课时费。</p>
          </Link>
          <Link className="feature-card" href="/feedback">
            <h3>风险与功能反馈</h3>
            <p>记录联系方式滥用、虚假信息、骚扰和功能异常反馈。</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
