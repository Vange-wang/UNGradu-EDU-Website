import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { SessionNav } from "@/features/auth/session-nav";

import "./globals.css";

export const metadata: Metadata = {
  description: "东莞大学城家教对接平台",
  icons: {
    icon: "/assets/sitewide-ui/brand-mark.png"
  },
  title: "UNGradu EDU"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <header className="site-header">
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
          <nav className="top-nav" aria-label="主导航">
            <SessionNav />
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
