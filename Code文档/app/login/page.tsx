import Image from "next/image";

import { LoginPageContent } from "@/features/auth/login-page-content";

export default function LoginPage() {
  return (
    <div className="page auth-page sitewide-refresh-page">
      <section className="auth-shell sitewide-auth-shell">
        <div className="auth-intro sitewide-auth-intro">
          <div>
            <span className="eyebrow">邮箱账号入口</span>
            <h1>登录 / 注册</h1>
            <p>使用邮箱验证码登录或注册；设置密码后可用邮箱密码登录。</p>
          </div>
          <div className="login-approved-stage" aria-hidden="true">
            <Image
              alt=""
              className="login-approved-person login-approved-boy"
              height={187}
              src="/assets/sitewide-ui/login-boy.png"
              width={135}
            />
            <div className="login-approved-chat-card">
              <strong>进入平台</strong>
              <span>登录后继续发布<br />和沟通</span>
            </div>
            <Image
              alt=""
              className="login-approved-person login-approved-girl"
              height={187}
              src="/assets/sitewide-ui/login-girl.png"
              width={132}
            />
          </div>
          <div className="auth-note-list" aria-label="登录说明">
            <span>
              <Image alt="" height={56} src="/assets/sitewide-ui/login-note-account.png" width={56} />
              首次验证码登录即创建账号
            </span>
            <span>
              <Image alt="" height={55} src="/assets/sitewide-ui/login-note-safety.png" width={55} />
              登录后可补充联系方式，交换仍需双方确认
            </span>
            <span>
              <Image alt="" height={56} src="/assets/sitewide-ui/login-note-lock.png" width={55} />
              暂不提供实名认证或第三方认证
            </span>
          </div>
          <Image
            alt=""
            className="login-approved-decor"
            height={119}
            src="/assets/sitewide-ui/login-decor.png"
            width={144}
          />
        </div>

        <div className="auth-card">
          <LoginPageContent />
        </div>
      </section>
    </div>
  );
}
