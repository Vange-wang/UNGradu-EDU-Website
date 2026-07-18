const DEFAULT_UPSTREAM_ORIGIN =
  "https://ungradu-edu-prod-275285-6-1445807473.sh.run.tcloudbase.com";
const PRIMARY_PUBLIC_ORIGIN = "https://ungradeedu.eu.cc";
const canonicalRedirectHosts = new Set(["www.ungradeedu.eu.cc"]);

const defaultSecurityHeaders = new Headers({
  "Content-Security-Policy": [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https: wss:",
    "media-src 'self' data: blob: https:",
    "worker-src 'self' blob:"
  ].join("; "),
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=86400",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY"
});

const requestHeadersToDrop = new Set([
  "cf-connecting-ip",
  "cf-ipcountry",
  "cf-ray",
  "cf-visitor",
  "forwarded",
  "host",
  "x-forwarded-for",
  "x-forwarded-host",
  "x-forwarded-proto",
  "x-real-ip"
]);

const responseHeadersToDrop = new Set([
  "server",
  "x-powered-by",
  "x-request-id",
  "x-tcb-request-id",
  "x-tencent-request-id"
]);

const responseHeaderPrefixesToDrop = [
  "x-cloudbase-",
  "x-cloudbaserun-",
  "x-nextjs-",
  "x-upstream-"
];

function shouldDropResponseHeader(header) {
  const normalizedHeader = header.toLowerCase();
  return (
    responseHeadersToDrop.has(normalizedHeader) ||
    responseHeaderPrefixesToDrop.some((prefix) => normalizedHeader.startsWith(prefix))
  );
}

function normalizeOrigin(origin) {
  const normalized = new URL(origin);
  normalized.pathname = "";
  normalized.search = "";
  normalized.hash = "";
  return normalized;
}

function resolveUpstreamOrigin(env) {
  return env?.UPSTREAM_ORIGIN || DEFAULT_UPSTREAM_ORIGIN;
}

function buildCanonicalRedirect(request) {
  const incomingUrl = new URL(request.url);
  if (!canonicalRedirectHosts.has(incomingUrl.hostname.toLowerCase())) {
    return null;
  }

  const canonicalUrl = new URL(incomingUrl.pathname + incomingUrl.search, PRIMARY_PUBLIC_ORIGIN);
  return Response.redirect(canonicalUrl, 308);
}

function buildUpstreamRequest(request, upstreamOrigin) {
  const incomingUrl = new URL(request.url);
  const upstreamUrl = new URL(upstreamOrigin);
  upstreamUrl.pathname = incomingUrl.pathname;
  upstreamUrl.search = incomingUrl.search;

  const headers = new Headers(request.headers);
  for (const header of requestHeadersToDrop) {
    headers.delete(header);
  }
  headers.set("host", upstreamUrl.host);
  headers.set("x-forwarded-proto", incomingUrl.protocol.replace(":", ""));

  return new Request(upstreamUrl, {
    body: request.body,
    headers,
    method: request.method,
    redirect: "manual"
  });
}

function hardenResponse(response) {
  const headers = new Headers(response.headers);
  const headersToDelete = [...headers.keys()].filter(shouldDropResponseHeader);
  for (const header of headersToDelete) {
    headers.delete(header);
  }
  for (const [key, value] of defaultSecurityHeaders) {
    headers.set(key, value);
  }

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText
  });
}

const worker = {
  async fetch(request, env) {
    const canonicalRedirect = buildCanonicalRedirect(request);
    if (canonicalRedirect) {
      return canonicalRedirect;
    }

    const upstreamOrigin = normalizeOrigin(resolveUpstreamOrigin(env));
    const upstreamRequest = buildUpstreamRequest(request, upstreamOrigin);
    const upstreamResponse = await fetch(upstreamRequest);

    return hardenResponse(upstreamResponse);
  }
};

export default worker;
