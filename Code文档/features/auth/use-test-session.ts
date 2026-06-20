"use client";

import { useEffect, useState } from "react";

import { readTestSession, type TestSession } from "@/features/auth/test-auth";
import { getBrowserStorage } from "@/lib/storage";

export function useTestSession() {
  const [session, setSession] = useState<TestSession | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const storage = getBrowserStorage();
    setSession(storage ? readTestSession(storage) : null);
    setLoaded(true);
  }, []);

  return { loaded, session };
}
