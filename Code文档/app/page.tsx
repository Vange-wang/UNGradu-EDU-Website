import Link from "next/link";

import { GuardedEntryLink } from "@/features/auth/guarded-entry-link";

const steps = [
  ["发布", "填写需求或家教资料。"],
  ["筛选", "按科目、学段、价格查看合适对象。"],
  ["沟通", "先站内确认上课安排。"],
  ["确认", "二次确认后才展示联系方式。"]
];

export default function HomePage() {
  return (
    <div className="page">
      <section className="gateway-hero">
        <div className="gateway-layout">
          <div className="hero-copy">
            <span className="eyebrow">东莞大学城 · 先聊清楚</span>
            <h1>找家教这件事，要清楚也要安心。</h1>
            <p>
              先发布需求或资料，再站内沟通；双方确认后才交换联系方式。
            </p>
            <div className="gateway-entry-grid" aria-label="身份入口">
              <div className="gateway-entry parent-entry">
                <span>家长 / 学生</span>
                <strong>发布找老师需求</strong>
                <small>填写科目、预算和上课偏好。</small>
                <GuardedEntryLink className="button primary full-width" href="/parent-needs/new">
                  我要找家教
                </GuardedEntryLink>
              </div>
              <div className="gateway-entry tutor-entry">
                <span>大学生家教</span>
                <strong>发布可教资料</strong>
                <small>填写可教科目、时间和课时费。</small>
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
            <span className="eyebrow">试运行</span>
            <h2>先站内聊，再放心联系</h2>
            <div className="dplus-comic-stage" aria-hidden="true">
              <div className="dplus-comic-duo">
                <div className="dplus-person parent" />
                <div className="dplus-chat-card">
                  <strong>站内沟通</strong>
                  <span>确认科目、时间、预算和意向</span>
                </div>
                <div className="dplus-person tutor" />
              </div>
            </div>
            <p>
              平台不做支付、担保、认证或人工仲裁。
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
              发布、沟通、确认
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
            <span className="eyebrow">核心入口</span>
            <h2 className="section-title" id="entry-title">
              从广场开始筛选
            </h2>
          </div>
        </div>
        <div className="dplus-mini-grid">
          <Link className="dplus-mini-card" href="/parent-needs">
            <strong>需求广场</strong>
            <span>大学生浏览家长需求，按科目、学段、预算和性别偏好筛选。</span>
          </Link>
          <Link className="dplus-mini-card" href="/tutor-profiles">
            <strong>家教信息广场</strong>
            <span>家长浏览大学生家教信息，查看可教科目、学段和课时费。</span>
          </Link>
          <Link className="dplus-mini-card" href="/feedback">
            <strong>风险与功能反馈</strong>
            <span>记录联系方式滥用、虚假信息、骚扰和功能异常反馈。</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
