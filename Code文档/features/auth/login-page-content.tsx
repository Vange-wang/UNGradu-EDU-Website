"use client";

import Link from "next/link";
import { Suspense } from "react";

import { LoginForm } from "@/features/auth/login-form";
import { LogoutButton } from "@/features/auth/logout-button";
import { useTestSession } from "@/features/auth/use-test-session";

export function LoginPageContent() {
  const { loaded, session } = useTestSession();

  if (!loaded) {
    return <p className="auth-loading">正在读取登录状态...</p>;
  }

  if (session) {
    return (
      <div className="login-state-panel">
        <span className="eyebrow">已登录</span>
        <p>
          当前已登录：{session.emailMasked ?? "当前账号"}。如需注册或登录另一个账号，请先退出。
        </p>
        <div className="action-row">
          <Link className="button primary" href="/profile">
            进入个人页
          </Link>
          <LogoutButton />
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<p className="auth-loading">正在准备登录表单...</p>}>
      <LoginForm />
    </Suspense>
  );
}
