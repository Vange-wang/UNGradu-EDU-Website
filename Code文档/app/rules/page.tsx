import Link from "next/link";

export default function RulesPage() {
  return (
    <div className="page">
      <section className="notice-layout">
        <aside className="notice-aside">
          <span className="eyebrow">平台边界</span>
          <h1>规则先讲清楚，再开始沟通。</h1>
          <p>当前为小范围试运行，先发布、筛选、站内沟通，再确认是否交换联系方式。</p>
          <Link className="button secondary" href="/">
            返回首页
          </Link>
        </aside>

        <div className="notice-panel dplus-notice-list">
          <div className="notice-item notice-item-strong">
            <h2>免费试运行</h2>
            <p>试运行阶段免费使用，不做支付、抽佣、成交追踪或评价。</p>
          </div>
          <div className="notice-item">
            <h2>联系方式交换规则</h2>
            <p>
              联系方式必须经双方同意并二次确认后展示；公开列表和详情页不展示双方手机号、微信号或其他直接联系方式。
            </p>
          </div>
          <div className="notice-item">
            <h2>平台能力边界</h2>
            <p>
              平台不提供担保交易、认证、退款、合同或人工仲裁。
            </p>
          </div>
          <div className="notice-item">
            <h2>沟通安全提醒</h2>
            <p>
              请先确认科目、时间、地点范围和预算，再决定是否交换联系方式；不要在公开说明、站内消息或反馈描述中直接发送手机号、微信号、详细住址、证件或支付凭证。
            </p>
          </div>
          <div className="notice-item">
            <h2>公开访问与安全提示</h2>
            <p>
              推荐通过项目方提供的 HTTPS 入口访问；如使用 Cloudflare Worker 临时入口，它仅作为访问与基础安全加固方案，不代表平台已完成完整安全防护或认证背书，生产安全门禁仍以 ISSUE-0020 的配置验收为准。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
