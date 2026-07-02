"use client";

import Link from "next/link";

import { RequireTestSession } from "@/features/auth/require-test-session";
import { LogoutButton } from "@/features/auth/logout-button";
import { PasswordSettingsForm } from "@/features/auth/password-settings-form";

const profileLinks = [
  {
    description: "维护用于双方授权交换的手机号和微信号。",
    href: "/profile/contact",
    meta: "隐私资料",
    title: "联系方式管理"
  },
  {
    description: "查看自己发布的家教需求，或继续发布新需求。",
    href: "/profile/parent-needs",
    meta: "家长侧",
    title: "我发布的需求"
  },
  {
    description: "查看和维护自己的大学生家教信息。",
    href: "/profile/tutor-profiles",
    meta: "老师侧",
    title: "我发布的家教信息"
  },
  {
    description: "进入自己参与的站内聊天会话。",
    href: "/profile/chats",
    meta: "沟通记录",
    title: "我的聊天"
  }
];

export default function ProfilePage() {
  return (
    <div className="page">
      <RequireTestSession>
        {(session) => (
          <section className="wide-panel">
            <div className="workspace-header">
              <div>
                <span className="eyebrow">个人中心</span>
                <h1 className="section-title">个人中心</h1>
                <p>管理账号、联系方式、发布记录和站内沟通入口。</p>
              </div>
              <Link className="button secondary" href="/">
                返回首页
              </Link>
            </div>

            <div className="account-dashboard">
              <aside className="account-summary">
                <span className="eyebrow">当前账号</span>
                <h2>{session.emailMasked ?? session.phone}</h2>
                <p>同一个账号可同时使用家长端和大学生端能力。</p>
                <div className="account-status-grid">
                  <div>
                    <strong>4</strong>
                    <span>个功能入口</span>
                  </div>
                  <div>
                    <strong>2</strong>
                    <span>种身份场景</span>
                  </div>
                </div>
                <LogoutButton />
              </aside>

              <div className="account-main">
                <div className="account-card-grid">
                  {profileLinks.map((link) => (
                    <Link className="account-card" href={link.href} key={link.href}>
                      <span>{link.meta}</span>
                      <strong>{link.title}</strong>
                      <p>{link.description}</p>
                    </Link>
                  ))}
                </div>

                <section className="account-settings-panel">
                  <PasswordSettingsForm emailMasked={session.emailMasked} />
                </section>
              </div>
            </div>
          </section>
        )}
      </RequireTestSession>
    </div>
  );
}
