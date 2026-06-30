import Link from "next/link";

export default function FeedbackPage() {
  return (
    <div className="page">
      <section className="notice-layout">
        <aside className="notice-aside">
          <span className="eyebrow">反馈入口</span>
          <h1>风险与功能反馈</h1>
          <Link className="button secondary" href="/">
            返回首页
          </Link>
        </aside>

        <div className="notice-panel">
          <div className="notice-item notice-item-strong">
            <h2>可提交的反馈</h2>
            <p>
              如遇联系方式滥用、虚假信息、骚扰或功能异常，请通过反馈提交页提交反馈。
            </p>
          </div>
          <div className="notice-item">
            <h2>当前处理边界</h2>
            <p>
              当前阶段仅记录和排查反馈，不承诺即时客服或人工介入处理。
            </p>
          </div>
          <a
            className="button primary"
            href="https://github.com/Vange-wang/UNGradu-EDU-Website/issues/new"
            rel="noreferrer"
            target="_blank"
          >
            提交反馈
          </a>
        </div>
      </section>
    </div>
  );
}
