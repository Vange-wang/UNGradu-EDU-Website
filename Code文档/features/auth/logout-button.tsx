"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [message, setMessage] = useState("");

  async function logout() {
    setMessage("");

    const response = await fetch("/api/auth/logout", {
      credentials: "same-origin",
      method: "POST"
    });

    if (!response.ok) {
      setMessage("退出登录失败，请稍后重试。");
      return;
    }

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
