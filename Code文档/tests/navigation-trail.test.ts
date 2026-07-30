import { describe, expect, it } from "vitest";

import {
  advanceNavigationTrail,
  consumeNavigationTrailBack,
  getNavigationTrailBackRoute,
  readNavigationTrail
} from "@/features/navigation/navigation-trail";

describe("same-tab navigation trail", () => {
  it("returns directly to home when a publishing page was opened from home", () => {
    const trail = advanceNavigationTrail(["/"], "/parent-needs/new", "push");

    expect(trail).toEqual(["/", "/parent-needs/new"]);
    expect(getNavigationTrailBackRoute(trail, "/parent-needs/new")).toBe("/");
  });

  it("unwinds the real profile path one visited page at a time", () => {
    const fromProfile = advanceNavigationTrail(
      ["/profile"],
      "/profile/parent-needs",
      "push"
    );
    const atPublishingPage = advanceNavigationTrail(
      fromProfile,
      "/parent-needs/new",
      "push"
    );

    expect(getNavigationTrailBackRoute(atPublishingPage, "/parent-needs/new")).toBe(
      "/profile/parent-needs"
    );

    const backAtNeeds = advanceNavigationTrail(
      atPublishingPage,
      "/profile/parent-needs",
      "push"
    );

    expect(backAtNeeds).toEqual(["/profile", "/profile/parent-needs"]);
    expect(getNavigationTrailBackRoute(backAtNeeds, "/profile/parent-needs")).toBe(
      "/profile"
    );
  });

  it("uses the deterministic parent as a safe fallback without a same-tab trail", () => {
    expect(getNavigationTrailBackRoute([], "/parent-needs/new")).toBe(
      "/profile/parent-needs"
    );
    expect(getNavigationTrailBackRoute([], "/login")).toBe("/");
  });

  it("does not create duplicate levels for repeated visits", () => {
    expect(
      advanceNavigationTrail(
        ["/", "/profile", "/profile/parent-needs"],
        "/profile/parent-needs",
        "push"
      )
    ).toEqual(["/", "/profile", "/profile/parent-needs"]);
  });

  it("collapses replace and redirect hops into one real destination level", () => {
    const atLogin = advanceNavigationTrail(["/"], "/login", "push");
    const atCallback = advanceNavigationTrail(atLogin, "/auth/callback", "replace");
    const atDestination = advanceNavigationTrail(
      atCallback,
      "/profile/parent-needs",
      "replace"
    );

    expect(atDestination).toEqual(["/", "/profile/parent-needs"]);
    expect(getNavigationTrailBackRoute(atDestination, "/profile/parent-needs")).toBe(
      "/"
    );
  });

  it("rejects a copied trail when the browser history belongs to another tab", () => {
    const serialized = JSON.stringify({
      tabId: "original-tab",
      paths: ["/", "/parent-needs/new"]
    });

    expect(readNavigationTrail(serialized, "new-tab")).toEqual([]);
    expect(readNavigationTrail(serialized, "original-tab")).toEqual([
      "/",
      "/parent-needs/new"
    ]);
  });

  it("consumes the current page before a Header back navigation", () => {
    expect(
      consumeNavigationTrailBack(["/", "/parent-needs/new"], "/parent-needs/new")
    ).toEqual(["/"]);
  });

  it("shrinks monotonically across consecutive Header back navigations", () => {
    let trail = ["/", "/profile", "/profile/parent-needs", "/parent-needs/new"];

    expect(getNavigationTrailBackRoute(trail, "/parent-needs/new")).toBe(
      "/profile/parent-needs"
    );
    trail = consumeNavigationTrailBack(trail, "/parent-needs/new");
    trail = advanceNavigationTrail(trail, "/profile/parent-needs", "push");
    expect(trail).toEqual(["/", "/profile", "/profile/parent-needs"]);

    expect(getNavigationTrailBackRoute(trail, "/profile/parent-needs")).toBe(
      "/profile"
    );
    trail = consumeNavigationTrailBack(trail, "/profile/parent-needs");
    trail = advanceNavigationTrail(trail, "/profile", "push");
    expect(trail).toEqual(["/", "/profile"]);

    expect(getNavigationTrailBackRoute(trail, "/profile")).toBe("/");
    trail = consumeNavigationTrailBack(trail, "/profile");
    trail = advanceNavigationTrail(trail, "/", "push");
    expect(trail).toEqual(["/"]);
  });

  it("does not turn a fallback return into a two-page loop", () => {
    const directTrail: string[] = [];
    const fallbackRoute = getNavigationTrailBackRoute(
      directTrail,
      "/parent-needs/new"
    );
    const afterFallback = advanceNavigationTrail(
      consumeNavigationTrailBack(directTrail, "/parent-needs/new"),
      fallbackRoute,
      "push"
    );

    expect(fallbackRoute).toBe("/profile/parent-needs");
    expect(afterFallback).toEqual(["/profile/parent-needs"]);
    expect(
      getNavigationTrailBackRoute(afterFallback, "/profile/parent-needs")
    ).toBe("/profile");
  });
});
