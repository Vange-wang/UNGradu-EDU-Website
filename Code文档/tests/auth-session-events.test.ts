import { describe, expect, it, vi } from "vitest";

import {
  AUTH_SESSION_CHANGED_EVENT,
  notifyAuthSessionAnonymous,
  notifyAuthSessionAuthenticated,
  subscribeAuthSessionChanged
} from "@/features/auth/auth-session-events";

describe("auth session change events", () => {
  it("notifies subscribers when the auth session changes", () => {
    const target = new EventTarget();
    const listener = vi.fn();
    const unsubscribe = subscribeAuthSessionChanged(listener, target);

    notifyAuthSessionAuthenticated(target);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0]?.[0]).toMatchObject({
      detail: { status: "authenticated" },
      type: AUTH_SESSION_CHANGED_EVENT
    });

    unsubscribe();
    notifyAuthSessionAnonymous(target);

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("stops notifying unsubscribed listeners", () => {
    const target = new EventTarget();
    const listener = vi.fn();
    const unsubscribe = subscribeAuthSessionChanged(listener, target);

    unsubscribe();
    notifyAuthSessionAnonymous(target);

    expect(listener).not.toHaveBeenCalled();
  });

  it("uses a stable browser event name for login and logout flows", () => {
    expect(AUTH_SESSION_CHANGED_EVENT).toBe("auth-session-changed");
  });
});
