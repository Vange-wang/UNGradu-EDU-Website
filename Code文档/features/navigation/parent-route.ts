const staticParentRoutes: Record<string, string> = {
  "/chats": "/profile/chats",
  "/profile/chats": "/profile",
  "/profile/contact": "/profile",
  "/profile/parent-needs": "/profile",
  "/profile/tutor-profiles": "/profile",
  "/profile": "/",
  "/parent-needs/new": "/profile/parent-needs",
  "/tutor-profiles/new": "/profile/tutor-profiles",
  "/login": "/",
  "/rules": "/",
  "/feedback": "/",
  "/customer-service": "/"
};

function normalizePathname(pathname: string) {
  const withoutQuery = pathname.split(/[?#]/, 1)[0] || "/";
  const normalized = withoutQuery.replace(/\/{2,}/g, "/").replace(/\/$/, "");

  return normalized || "/";
}

export function getParentRoute(pathname: string) {
  const normalizedPathname = normalizePathname(pathname);

  if (staticParentRoutes[normalizedPathname]) {
    return staticParentRoutes[normalizedPathname];
  }

  if (/^\/chats\/[^/]+$/.test(normalizedPathname)) {
    return "/profile/chats";
  }

  if (/^\/parent-needs\/[^/]+$/.test(normalizedPathname)) {
    return "/parent-needs";
  }

  if (/^\/tutor-profiles\/[^/]+$/.test(normalizedPathname)) {
    return "/tutor-profiles";
  }

  return "/";
}
