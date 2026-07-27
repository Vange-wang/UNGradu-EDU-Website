import Image from "next/image";
import Link from "next/link";

import { GuardedEntryLink } from "@/features/auth/guarded-entry-link";

export default function HomePage() {
  return (
    <div className="page sitewide-refresh-page home-refresh-page home-native-static-reference">
      <section className="home-refresh-layout" aria-labelledby="home-title">
        <div className="home-refresh-main">
          <div className="home-title-block">
            <span className="home-kicker">大学生家教 · 先聊清楚</span>
            <Image
              alt=""
              aria-hidden="true"
              className="home-approved-decor home-approved-decor-left"
              height={225}
              priority
              src="/assets/sitewide-ui/home-decor-left.png"
              width={66}
            />
            <Image
              alt=""
              aria-hidden="true"
              className="home-approved-decor home-approved-decor-right"
              height={240}
              priority
              src="/assets/sitewide-ui/home-decor-right.png"
              width={160}
            />
            <h1 id="home-title">大学生家教平台</h1>
            <div className="home-benefits" aria-label="平台特点">
              <strong>更安心</strong>
              <strong>更便捷</strong>
              <strong>选择多</strong>
            </div>
          </div>

          <div className="home-entry-grid" aria-label="发布入口">
            <article className="home-entry-card home-entry-parent">
              <span>家长 / 学生</span>
              <h2>发布找老师需求</h2>
              <p>填写科目、预算和上课偏好。</p>
              <GuardedEntryLink
                className="button home-entry-button"
                href="/parent-needs/new"
              >
                我要找家教
              </GuardedEntryLink>
            </article>
            <article className="home-entry-card home-entry-tutor">
              <span>大学生家教</span>
              <h2>发布老师信息</h2>
              <p>填写可教科目、时间和课时费。</p>
              <GuardedEntryLink
                className="button home-entry-button"
                href="/tutor-profiles/new"
              >
                我要做家教
              </GuardedEntryLink>
            </article>
          </div>

          <nav className="home-link-grid" aria-label="核心入口">
            <Link className="home-link-card home-link-blue" href="/parent-needs">
              <strong>需求广场</strong>
              <span>大学生浏览家长需求，按科目、学段、预算和性别偏好筛选。</span>
            </Link>
            <Link className="home-link-card home-link-lime" href="/tutor-profiles">
              <strong>家教信息广场</strong>
              <span>家长浏览大学生家教信息，查看可教科目、学校和课时费。</span>
            </Link>
            <Link className="home-link-card home-link-purple" href="/feedback">
              <strong>风险与功能反馈</strong>
              <span>记录联系方式滥用、虚假信息、骚扰和功能异常反馈。</span>
            </Link>
            <Link className="home-link-card home-link-cream" href="/customer-service">
              <strong>智能客服</strong>
              <span>咨询发布流程、联系方式交换、课时费边界和风险反馈入口。</span>
            </Link>
          </nav>
        </div>

        <aside className="home-principles-card" aria-label="沟通原则">
          <span className="home-trial-pill">试运行</span>
          <h2>
            先站内聊
            <span>再放心联系</span>
          </h2>
          <div className="dplus-comic-stage home-comic-stage" aria-hidden="true">
            <div className="home-approved-comic-duo">
              <Image
                alt=""
                className="home-approved-person home-approved-person-boy"
                height={196}
                priority
                src="/assets/sitewide-ui/home-boy.png"
                width={144}
              />
              <div className="dplus-chat-card">
                <strong>站内沟通</strong>
                <span>确认科目</span>
                <span>确认时间</span>
                <span>确认预算</span>
                <span>确认意向</span>
              </div>
              <Image
                alt=""
                className="home-approved-person home-approved-person-girl"
                height={196}
                priority
                src="/assets/sitewide-ui/home-girl.png"
                width={139}
              />
            </div>
          </div>
          <ol className="home-principles-list">
            {[
              "联系方式仅在双方确认后交换",
              "交换联系信息前再次确认",
              "异常情况可提交记录并排查"
            ].map((principle, index) => (
              <li key={principle}>
                <Image
                  alt=""
                  aria-hidden="true"
                  height={59}
                  src="/assets/sitewide-ui/home-shield-check.png"
                  width={61}
                />
                <span>
                  {index + 1}. {principle}
                </span>
              </li>
            ))}
          </ol>
        </aside>
      </section>
    </div>
  );
}
