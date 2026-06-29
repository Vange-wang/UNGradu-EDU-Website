"use client";

import { useEffect, useState } from "react";

import { subscribeAuthSessionChanged } from "@/features/auth/auth-session-events";
import type { TestSession } from "@/features/auth/test-auth";

type SessionApiResult =
  | {
      ok: true;
      value: TestSession;
      errors: Record<string, never>;
    }
  | {
      ok: false;
      value: null;
      errors: { request?: string };
    };

export function useTestSession() {
  const [session, setSession] = useState<TestSession | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session", {
          credentials: "same-origin",
          method: "GET"
        });
        const result = await response.json() as SessionApiResult;

        if (!cancelled) {
          setSession(result.ok ? result.value : null);
        }
      } catch {
        if (!cancelled) {
          setSession(null);
        }
      } finally {
        if (!cancelled) {
          setLoaded(true);
        }
      }
    }

    void loadSession();
    const unsubscribe = subscribeAuthSessionChanged((event) => {
      if (event.detail.status === "anonymous") {
        setSession(null);
        setLoaded(true);
      } else {
        setLoaded(false);
      }

      void loadSession();
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return { loaded, session };
}
