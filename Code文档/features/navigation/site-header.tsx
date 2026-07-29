"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { SessionNav } from "@/features/auth/session-nav";

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="site-header-leading">
        {pathname !== "/" ? (
          <Link aria-label="返回首页" className="site-back-link" href="/">
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
