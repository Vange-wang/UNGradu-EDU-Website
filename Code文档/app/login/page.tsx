import { Suspense } from "react";

import { LoginForm } from "@/features/auth/login-form";

export default function LoginPage() {
  return (
    <div className="page">
      <section className="content-panel">
        <h1 className="section-title">手机号登录</h1>
        <p>
          M1 将先接入本地测试登录流程；正式上线前必须替换为合规手机号短信登录，
          并由后端可信机制维护登录态。
        </p>

        <Suspense fallback={<p>正在准备登录表单...</p>}>
          <LoginForm />
        </Suspense>
      </section>
    </div>
  );
}
