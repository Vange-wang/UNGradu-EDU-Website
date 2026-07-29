import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SiteHeader } from "@/features/navigation/site-header";

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
        <SiteHeader />
        <main>{children}</main>
      </body>
    </html>
  );
}
