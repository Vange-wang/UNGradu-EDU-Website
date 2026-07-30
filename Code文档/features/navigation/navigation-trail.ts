import {
  getParentRoute,
  normalizePathname
} from "@/features/navigation/parent-route";

export type NavigationMode = "push" | "replace";

type StoredNavigationTrail = {
  paths: string[];
  tabId: string;
};

const MAX_TRAIL_LENGTH = 50;

function normalizeTrail(paths: string[]) {
  return paths
    .filter((path): path is string => typeof path === "string")
    .map(normalizePathname)
    .slice(-MAX_TRAIL_LENGTH);
}

export function advanceNavigationTrail(
  paths: string[],
  pathname: string,
  mode: NavigationMode
) {
  const trail = normalizeTrail(paths);
  const currentPath = normalizePathname(pathname);

  if (trail.at(-1) === currentPath) {
    return trail;
  }

  const existingIndex = trail.lastIndexOf(currentPath);

  if (existingIndex >= 0) {
    return trail.slice(0, existingIndex + 1);
  }

  if (mode === "replace" && trail.length > 1) {
    return [...trail.slice(0, -1), currentPath];
  }

  return [...trail, currentPath].slice(-MAX_TRAIL_LENGTH);
}

export function getNavigationTrailBackRoute(paths: string[], pathname: string) {
  const trail = normalizeTrail(paths);
  const currentPath = normalizePathname(pathname);
  const currentIndex = trail.lastIndexOf(currentPath);

  if (currentIndex > 0) {
    return trail[currentIndex - 1];
  }

  return getParentRoute(currentPath);
}

export function consumeNavigationTrailBack(
  paths: string[],
  pathname: string
) {
  const trail = normalizeTrail(paths);
  const currentPath = normalizePathname(pathname);
  const currentIndex = trail.lastIndexOf(currentPath);

  if (currentIndex < 0) {
    return trail;
  }

  return trail.slice(0, currentIndex);
}

export function readNavigationTrail(serialized: string | null, tabId: string) {
  if (!serialized) {
    return [];
  }

  try {
    const parsed = JSON.parse(serialized) as Partial<StoredNavigationTrail>;

    if (parsed.tabId !== tabId || !Array.isArray(parsed.paths)) {
      return [];
    }

    return normalizeTrail(parsed.paths);
  } catch {
    return [];
  }
}

export function serializeNavigationTrail(paths: string[], tabId: string) {
  return JSON.stringify({
    paths: normalizeTrail(paths),
    tabId
  } satisfies StoredNavigationTrail);
}
