import Link from "next/link";

import { LoginPageContent } from "@/features/auth/login-page-content";

export default function LoginPage() {
  return (
    <div className="page auth-page">
      <section className="auth-shell">
        <div className="auth-intro">
          <Link className="button secondary" href="/">
            返回首页
          </Link>
          <div>
            <span className="eyebrow">邮箱账号入口</span>
            <h1>登录 / 注册</h1>
            <p>使用邮箱验证码登录或注册；设置密码后可用邮箱密码登录。</p>
          </div>
          <div className="dplus-comic-stage" aria-hidden="true">
            <div className="dplus-comic-duo">
              <div className="dplus-person parent" />
              <div className="dplus-chat-card">
                <strong>进入平台</strong>
                <span>登录后继续发布和沟通</span>
              </div>
              <div className="dplus-person tutor" />
            </div>
          </div>
          <div className="auth-note-list" aria-label="登录说明">
            <span>首次验证码登录即创建账号</span>
            <span>登录后可补充联系方式，交换仍需双方确认</span>
            <span>暂不提供实名认证或第三方认证</span>
          </div>
        </div>

        <div className="auth-card">
          <LoginPageContent />
        </div>
      </section>
    </div>
  );
}
