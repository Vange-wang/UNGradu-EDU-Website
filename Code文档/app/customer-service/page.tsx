import Link from "next/link";

import { CustomerServiceChat } from "@/features/customer-service/customer-service-chat";

export default function CustomerServicePage() {
  const difyWebAppUrl = process.env.NEXT_PUBLIC_DIFY_CUSTOMER_SERVICE_URL?.trim();

  return (
    <div className="page dplus-chat-page">
      <section className="wide-panel customer-service-page">
        <div className="workspace-header">
          <div>
            <span className="eyebrow">智能客服</span>
            <h1>
              先问清规则
              <span>再开始找家教</span>
            </h1>
            <p>
              <span>回答发布、沟通和联系方式交换。</span>
              <span>投诉、退款、合同或纠纷不由智能客服裁决。</span>
            </p>
          </div>
          <div className="action-row compact-actions">
            <Link className="button secondary" href="/rules">
              查看规则
            </Link>
            <Link className="button secondary" href="/feedback">
              风险反馈
            </Link>
          </div>
        </div>

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
            <p>
              <span>当前使用站内离线客服。</span>
              <span>Dify WebApp 仅作为延后入口。</span>
            </p>
            {difyWebAppUrl ? (
              <a
                className="customer-service-dify-entry"
                href={difyWebAppUrl}
                rel="noreferrer"
                target="_blank"
              >
                打开 Dify 客服
              </a>
            ) : (
              <code>NEXT_PUBLIC_DIFY_CUSTOMER_SERVICE_URL</code>
            )}
          </aside>

          <div className="customer-service-main">
            <CustomerServiceChat />
          </div>
        </div>
      </section>
    </div>
  );
}
