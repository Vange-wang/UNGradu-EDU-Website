"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";

import { useTestSession } from "@/features/auth/use-test-session";

type RequireTestSessionProps = {
  children: (session: NonNullable<ReturnType<typeof useTestSession>["session"]>) => ReactNode;
};

export function RequireTestSession({ children }: RequireTestSessionProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { loaded, session } = useTestSession();

  useEffect(() => {
    if (loaded && !session) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [loaded, pathname, router, session]);

  if (!loaded) {
    return <p>正在读取登录状态...</p>;
  }

  if (!session) {
    return <p>请先登录。</p>;
  }

  return children(session);
}
