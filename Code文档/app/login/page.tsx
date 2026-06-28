import Link from "next/link";

import { LoginPageContent } from "@/features/auth/login-page-content";

export default function LoginPage() {
  return (
    <div className="page">
      <section className="content-panel">
        <div className="section-heading-row">
          <div>
            <h1 className="section-title">登录 / 注册</h1>
          </div>
          <Link className="button secondary" href="/">
            返回首页
          </Link>
        </div>
        <p>
          可使用邮箱验证码登录或注册；设置密码后，也可以使用邮箱和密码登录。
        </p>

        <LoginPageContent />
      </section>
    </div>
  );
}
