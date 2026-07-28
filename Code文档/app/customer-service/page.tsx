import Link from "next/link";

import { CustomerServiceChat } from "@/features/customer-service/customer-service-chat";

export default function CustomerServicePage() {
  return (
    <div className="page dplus-chat-page customer-service-shell sitewide-refresh-page customer-service-native-static-reference">
      <Link aria-label="返回首页" className="page-back-arrow" href="/">
        <span aria-hidden="true">←</span>
      </Link>
      <section className="customer-service-info-strip">
        <div className="customer-service-info-title">
          <span className="eyebrow">智能客服</span>
          <h1>先问清规则 再开始找家教</h1>
        </div>
        <div className="customer-service-info-copy">
          <p>回答发布、沟通和联系方式交换。</p>
          <p>投诉、退款、合同或纠纷不由智能客服裁决。</p>
        </div>
        <div aria-hidden="true" className="customer-service-info-orb" />
        <div className="action-row compact-actions">
          <Link className="button secondary" href="/rules">
            查看规则
          </Link>
          <Link className="button secondary" href="/feedback">
            风险反馈
          </Link>
        </div>
      </section>

      <div className="customer-service-layout">
        <aside className="customer-service-side">
          <span className="eyebrow">可咨询内容</span>
          <h2>平台客服助手</h2>
          <ul>
            <li>家长 / 学生如何发布找老师需求。</li>
            <li>大学生如何发布可教资料。</li>
            <li>什么时候可以交换联系方式。</li>
            <li>课时费、付款和平台边界说明。</li>
            <li>风险反馈、虚假信息和骚扰记录。</li>
          </ul>
        </aside>

        <div className="customer-service-main">
          <CustomerServiceChat />
        </div>
      </div>
    </div>
  );
}
