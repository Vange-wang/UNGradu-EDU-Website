import Link from "next/link";

export default function FeedbackPage() {
  return (
    <div className="page">
      <section className="notice-layout">
        <aside className="notice-aside">
          <span className="eyebrow">风险与功能反馈</span>
          <h1>发现问题，先记录下来。</h1>
          <p>
            反馈用于帮助排查页面问题、信息问题和功能建议；当前不承诺即时客服或人工介入处理。
          </p>
          <Link className="button secondary" href="/">
            返回首页
          </Link>
        </aside>

        <div className="notice-panel dplus-notice-list">
          <div className="notice-item notice-item-strong">
            <h2>可提交的反馈</h2>
            <p>
              如遇联系方式滥用、虚假信息、骚扰或功能异常，请通过反馈入口提交说明。
            </p>
          </div>
          <div className="notice-item">
            <h2>当前处理边界</h2>
            <p>
              当前阶段仅记录和排查反馈，不承诺即时客服、人工介入、纠纷仲裁、退款处理或平台担保。
            </p>
          </div>
          <div className="notice-item">
            <h2>不要提交敏感信息</h2>
            <p>
              请不要在反馈中提交证件、支付凭证、完整联系方式或其他不必要的个人敏感信息。
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
