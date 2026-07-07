"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { notifyAuthSessionAnonymous } from "@/features/auth/auth-session-events";
import { useTestSession } from "@/features/auth/use-test-session";

export function SessionNav() {
  const router = useRouter();
  const { loaded, session } = useTestSession();
  const [message, setMessage] = useState("");

  async function logout() {
    setMessage("");

    const confirmed = window.confirm("确认退出登录吗？退出后需要重新登录。");

    if (!confirmed) {
      return;
    }

    const response = await fetch("/api/auth/logout", {
      credentials: "same-origin",
      method: "POST"
    });

    if (!response.ok) {
      setMessage("退出失败");
      return;
    }

    notifyAuthSessionAnonymous();
    router.push("/");
    router.refresh();
  }

  if (!loaded) {
    return (
      <>
        <Link href="/profile">个人页</Link>
        <Link href="/customer-service">智能客服</Link>
        <Link href="/rules">规则</Link>
      </>
    );
  }

  if (!session) {
    return (
      <>
        <Link href="/login">登录 / 注册</Link>
        <Link href="/customer-service">智能客服</Link>
        <Link href="/rules">规则</Link>
      </>
    );
  }

  return (
    <>
      <Link href="/profile">个人页</Link>
      <Link href="/customer-service">智能客服</Link>
      <button className="nav-button" onClick={() => void logout()} type="button">
        退出登录
      </button>
      <Link href="/rules">规则</Link>
      {message ? <span className="nav-error">{message}</span> : null}
    </>
  );
}
