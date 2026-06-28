import { LoginPageContent } from "@/features/auth/login-page-content";

export default function LoginPage() {
  return (
    <div className="page">
      <section className="content-panel">
        <h1 className="section-title">邮箱验证码登录</h1>
        <p>
          使用邮箱验证码登录或注册。登录成功后，刷新页面也会保持当前账号状态。
        </p>

        <LoginPageContent />
      </section>
    </div>
  );
}
