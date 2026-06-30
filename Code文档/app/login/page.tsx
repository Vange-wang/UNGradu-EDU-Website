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
            <span className="eyebrow">账号入口</span>
            <h1>登录 / 注册</h1>
            <p>
              可使用邮箱验证码登录或注册；设置密码后，也可以使用邮箱和密码登录。
            </p>
          </div>
          <div className="auth-note-list" aria-label="登录说明">
            <span>首次验证码登录会创建账号</span>
            <span>登录后可补充联系方式</span>
            <span>联系方式交换仍需双方确认</span>
          </div>
        </div>

        <div className="auth-card">
          <LoginPageContent />
        </div>
      </section>
    </div>
  );
}
