"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { SessionNav } from "@/features/auth/session-nav";
import { useNavigationTrailBackRoute } from "@/features/navigation/use-navigation-trail";

export function SiteHeader() {
  const pathname = usePathname();
  const backRoute = useNavigationTrailBackRoute(pathname ?? "/");

  return (
    <header className="site-header">
      <div className="site-header-leading">
        {pathname !== "/" ? (
          <Link aria-label="返回上一级" className="site-back-link" href={backRoute}>
            <span aria-hidden="true">←</span>
          </Link>
        ) : null}
        <Link aria-label="UNGradu EDU 首页" className="brand" href="/">
          <Image
            alt=""
            aria-hidden="true"
            className="brand-mark"
            height={49}
            priority
            src="/assets/sitewide-ui/brand-mark.png"
            width={49}
          />
          <span className="brand-name">UNGradu EDU</span>
        </Link>
      </div>
      <nav className="top-nav" aria-label="主导航">
        <SessionNav />
      </nav>
    </header>
  );
}
