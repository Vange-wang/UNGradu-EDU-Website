import Link from "next/link";

export default function RulesPage() {
  return (
    <div className="page">
      <section className="notice-layout">
        <aside className="notice-aside">
          <span className="eyebrow">规则说明</span>
          <h1>平台规则 / 费用说明</h1>
          <Link className="button secondary" href="/">
            返回首页
          </Link>
        </aside>

        <div className="notice-panel">
          <div className="notice-item">
            <h2>当前阶段免费试运行</h2>
            <p>
              MVP 阶段免费上线，不做支付、抽佣、成交追踪和评价体系。
            </p>
          </div>
          <div className="notice-item">
            <h2>联系方式交换规则</h2>
            <p>
              联系方式必须经双方同意并二次确认后展示；公开列表和详情页不展示双方联系方式。
            </p>
          </div>
          <div className="notice-item">
            <h2>平台能力边界</h2>
            <p>
              当前仅提供信息发布、筛选、站内沟通和双方确认后的联系方式交换，不提供担保交易、认证、退款、合同或人工仲裁。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
