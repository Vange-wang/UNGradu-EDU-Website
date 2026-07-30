import { describe, expect, it } from "vitest";

import { getParentRoute } from "@/features/navigation/parent-route";

describe("deterministic hierarchical parent routes", () => {
  it.each([
    ["/chats/conversation-a", "/profile/chats"],
    ["/profile/chats", "/profile"],
    ["/profile/contact", "/profile"],
    ["/profile/parent-needs", "/profile"],
    ["/profile/tutor-profiles", "/profile"],
    ["/profile", "/"],
    ["/parent-needs/new", "/profile/parent-needs"],
    ["/tutor-profiles/new", "/profile/tutor-profiles"],
    ["/parent-needs/need-a", "/parent-needs"],
    ["/tutor-profiles/profile-a", "/tutor-profiles"],
    ["/login", "/"],
    ["/rules", "/"],
    ["/feedback", "/"],
    ["/customer-service", "/"],
    ["/unknown", "/"],
    ["/", "/"]
  ])("maps %s to %s without relying on history", (pathname, expected) => {
    expect(getParentRoute(pathname)).toBe(expected);
  });
});
