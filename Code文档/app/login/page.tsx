import { Suspense } from "react";

import { LoginForm } from "@/features/auth/login-form";

export default function LoginPage() {
  return (
    <div className="page">
      <section className="content-panel">
        <h1 className="section-title">邮箱验证码登录</h1>
        <p>
          使用邮箱验证码登录或注册。登录成功后，系统会通过服务端可信 Cookie
          保持登录状态。
        </p>

        <Suspense fallback={<p>正在准备登录表单...</p>}>
          <LoginForm />
        </Suspense>
      </section>
    </div>
  );
}
