"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  advanceNavigationTrail,
  consumeNavigationTrailBack,
  getNavigationTrailBackRoute,
  readNavigationTrail,
  serializeNavigationTrail,
  type NavigationMode
} from "@/features/navigation/navigation-trail";
import { getParentRoute } from "@/features/navigation/parent-route";

const STORAGE_KEY = "ungradu:navigation-trail:v1";
const TAB_ID_STATE_KEY = "__ungraduNavigationTabId";

function createTabId() {
  return globalThis.crypto?.randomUUID?.() ??
    `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readHistoryTabId(state: unknown) {
  if (!state || typeof state !== "object") {
    return null;
  }

  const tabId = (state as Record<string, unknown>)[TAB_ID_STATE_KEY];

  return typeof tabId === "string" ? tabId : null;
}

function withTabId(state: unknown, tabId: string) {
  const currentState =
    state && typeof state === "object" ? (state as Record<string, unknown>) : {};

  return {
    ...currentState,
    [TAB_ID_STATE_KEY]: tabId
  };
}

export function useNavigationTrailBackRoute(pathname: string) {
  const [backRoute, setBackRoute] = useState(() => getParentRoute(pathname));
  const pendingModeRef = useRef<NavigationMode | null>(null);
  const tabIdRef = useRef<string | null>(null);

  useEffect(() => {
    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(window.history);
    const existingTabId = readHistoryTabId(window.history.state);
    const tabId = existingTabId ?? createTabId();

    tabIdRef.current = tabId;

    if (!existingTabId) {
      originalReplaceState(
        withTabId(window.history.state, tabId),
        "",
        window.location.href
      );
    }

    const patchedPushState: History["pushState"] = (state, unused, url) => {
      pendingModeRef.current = "push";
      originalPushState(withTabId(state, tabId), unused, url);
    };
    const patchedReplaceState: History["replaceState"] = (state, unused, url) => {
      if (pendingModeRef.current !== "push") {
        pendingModeRef.current = "replace";
      }

      originalReplaceState(withTabId(state, tabId), unused, url);
    };

    window.history.pushState = patchedPushState;
    window.history.replaceState = patchedReplaceState;

    return () => {
      if (window.history.pushState === patchedPushState) {
        window.history.pushState = originalPushState;
      }

      if (window.history.replaceState === patchedReplaceState) {
        window.history.replaceState = originalReplaceState;
      }
    };
  }, []);

  useEffect(() => {
    const tabId = tabIdRef.current;

    if (!tabId) {
      setBackRoute(getParentRoute(pathname));
      return;
    }

    const mode = pendingModeRef.current ?? "push";
    pendingModeRef.current = null;
    const storedTrail = readNavigationTrail(
      window.sessionStorage.getItem(STORAGE_KEY),
      tabId
    );
    const nextTrail = advanceNavigationTrail(storedTrail, pathname, mode);

    window.sessionStorage.setItem(
      STORAGE_KEY,
      serializeNavigationTrail(nextTrail, tabId)
    );
    setBackRoute(getNavigationTrailBackRoute(nextTrail, pathname));
  }, [pathname]);

  const consumeBackNavigation = useCallback(() => {
    const tabId = tabIdRef.current;

    if (!tabId) {
      return;
    }

    const storedTrail = readNavigationTrail(
      window.sessionStorage.getItem(STORAGE_KEY),
      tabId
    );
    const nextTrail = consumeNavigationTrailBack(storedTrail, pathname);

    window.sessionStorage.setItem(
      STORAGE_KEY,
      serializeNavigationTrail(nextTrail, tabId)
    );
  }, [pathname]);

  return { backRoute, consumeBackNavigation };
}
