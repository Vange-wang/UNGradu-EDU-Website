"use client";

import Link from "next/link";

import { RequireTestSession } from "@/features/auth/require-test-session";
import { LogoutButton } from "@/features/auth/logout-button";

const profileLinks = [
  ["联系方式管理", "/profile/contact", "维护用于双方授权交换的手机号和微信号。"],
  ["我发布的需求", "/profile/parent-needs", "查看和维护自己发布的家教需求。"],
  ["我发布的家教信息", "/profile/tutor-profiles", "查看和维护自己的大学生家教信息。"],
  ["我的聊天", "/profile/chats", "进入自己参与的站内聊天会话。"]
];

export default function ProfilePage() {
  return (
    <div className="page">
      <RequireTestSession>
        {(session) => (
          <section className="content-panel">
            <h1 className="section-title">个人页面</h1>
            <p>
              当前测试账号：{session.phone}。同一个账号可同时使用家长端和大学生端能力。
            </p>

            <div className="link-list">
              {profileLinks.map(([title, href, description]) => (
                <Link className="link-item" href={href} key={href}>
                  <strong>{title}</strong>
                  <span>{description}</span>
                </Link>
              ))}
            </div>

            <LogoutButton />
          </section>
        )}
      </RequireTestSession>
    </div>
  );
}
