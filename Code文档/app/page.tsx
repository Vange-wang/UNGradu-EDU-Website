import Link from "next/link";

const steps = [
  ["发布信息", "家长发布需求，大学生发布个人家教信息。"],
  ["筛选详情", "双方按科目、学段、价格和性别查看合适对象。"],
  ["站内沟通", "先通过基础文字聊天确认具体上课情况。"],
  ["双向同意", "二次确认后才展示双方存档联系方式。"]
];

export default function HomePage() {
  return (
    <div className="page">
      <section className="hero">
        <div className="hero-copy">
          <h1>东莞大学城家教对接</h1>
          <p>
            面向本地家教供需的自助撮合平台。MVP
            先打通发布、筛选、聊天和双向同意交换联系方式的核心闭环。
          </p>
          <div className="action-row">
            <Link className="button primary" href="/parent-needs/new">
              我要找家教
            </Link>
            <Link className="button secondary" href="/tutor-profiles/new">
              我要做家教
            </Link>
            <Link className="button secondary" href="/profile">
              个人页面
            </Link>
          </div>
        </div>

        <div className="hero-panel" aria-label="平台流程">
          <ol className="flow-list">
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
        </div>
      </section>

      <section aria-labelledby="entry-title">
        <h2 className="section-title" id="entry-title">
          MVP 入口
        </h2>
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
            <h3>反馈/联系客服</h3>
            <p>处理联系方式滥用、虚假信息、骚扰和功能异常反馈。</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
