"use client";

import { useRouter } from "next/navigation";

import { useTestSession } from "@/features/auth/use-test-session";

type GuardedEntryLinkProps = {
  children: string;
  className: string;
  href: string;
};

export function GuardedEntryLink({
  children,
  className,
  href
}: GuardedEntryLinkProps) {
  const router = useRouter();
  const { loaded, session } = useTestSession();

  function openTarget() {
    if (!loaded) {
      return;
    }

    router.push(session ? href : `/login?next=${encodeURIComponent(href)}`);
  }

  return (
    <button className={className} disabled={!loaded} onClick={openTarget} type="button">
      {children}
    </button>
  );
}
