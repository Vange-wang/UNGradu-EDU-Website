import Image from "next/image";
import Link from "next/link";

export default function RulesPage() {
  return (
    <div className="page sitewide-refresh-page rules-refresh-page rules-native-static-reference">
      <Link aria-label="返回首页" className="page-back-arrow" href="/">
        <span aria-hidden="true">←</span>
      </Link>
      <section className="notice-layout rules-refresh-layout">
        <aside className="notice-aside">
          <span className="eyebrow">平台边界</span>
          <h1>
            规则先讲清楚，
            <span>再开始沟通。</span>
          </h1>
          <p>当前为小范围试运行，先发布、筛选、站内沟通，再确认是否交换联系方式。</p>
          <div className="rules-comic" aria-hidden="true">
            <Image
              alt=""
              height={268}
              src="/assets/sitewide-ui/rules-student-shield.png"
              width={417}
            />
          </div>
        </aside>

        <div className="notice-panel dplus-notice-list rules-card-list">
          <div className="notice-item notice-item-strong" data-rule-number="1">
            <span aria-hidden="true" className="rule-check">✓</span>
            <div>
              <h2>1. 免费试运行</h2>
              <p>试运行阶段免费使用，不做支付、抽佣、成交追踪或评价。</p>
            </div>
          </div>
          <div className="notice-item" data-rule-number="2">
            <span aria-hidden="true" className="rule-check">✓</span>
            <div>
              <h2>2. 联系方式交换规则</h2>
              <p>
                联系方式必须经双方同意并二次确认后展示；公开列表和详情页不展示双方手机号、微信号或其他直接联系方式。
              </p>
            </div>
          </div>
          <div className="notice-item" data-rule-number="3">
            <span aria-hidden="true" className="rule-check">✓</span>
            <div>
              <h2>3. 平台能力边界</h2>
              <p>平台不提供担保交易、认证、退款、合同或人工仲裁。</p>
            </div>
          </div>
          <div className="notice-item" data-rule-number="4">
            <span aria-hidden="true" className="rule-check">✓</span>
            <div>
              <h2>4. 沟通安全提醒</h2>
              <p>
                请先确认科目、时间、地点范围和预算，再决定是否交换联系方式；不要在公开说明、站内消息或反馈描述中直接发送手机号、微信号、详细住址、证件或支付凭证。
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
