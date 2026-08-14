"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { fetchWithCsrf } from "@/features/api/api-client";
import { notifyAuthSessionAnonymous } from "@/features/auth/auth-session-events";

export function logoutFromApi(fetcher: typeof fetch = fetch) {
  return fetchWithCsrf(fetcher, "/api/auth/logout", {
    credentials: "same-origin",
    method: "POST"
  });
}

export function LogoutButton() {
  const router = useRouter();
  const [message, setMessage] = useState("");

  async function logout() {
    setMessage("");

    const confirmed = window.confirm("确认退出登录吗？退出后需要重新登录。");

    if (!confirmed) {
      return;
    }

    const response = await logoutFromApi();

    if (!response.ok) {
      setMessage("退出登录失败，请稍后重试。");
      return;
    }

    notifyAuthSessionAnonymous();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="action-block">
      <button className="button secondary" onClick={() => void logout()} type="button">
        退出登录
      </button>
      {message ? <p className="error">{message}</p> : null}
    </div>
  );
}
