import Link from "next/link";

export default function FeedbackPage() {
  return (
    <div className="page">
      <section className="content-panel">
        <div className="section-heading-row">
          <div>
            <h1 className="section-title">反馈/联系客服</h1>
          </div>
          <Link className="button secondary" href="/">
            返回首页
          </Link>
        </div>
        <p>
          如遇联系方式滥用、虚假信息、骚扰或功能异常，请通过反馈提交页提交反馈。
          MVP 阶段将在 3 个工作日内人工查看。
        </p>
        <a
          className="button primary"
          href="https://github.com/Vange-wang/UNGradu-EDU-Website/issues/new"
          rel="noreferrer"
          target="_blank"
        >
          打开反馈提交页
        </a>
      </section>
    </div>
  );
}
