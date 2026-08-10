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

// Per-request CSP nonces require the App Router tree to render dynamically;
// otherwise a static HTML shell cannot receive the request-bound nonce.
export const dynamic = "force-dynamic";

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
