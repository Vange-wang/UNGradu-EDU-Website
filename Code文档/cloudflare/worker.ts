type Env = {
  UPSTREAM_ORIGIN: string;
  ORIGIN_VERIFY_SECRET?: string;
};

const PRIMARY_PUBLIC_ORIGIN = "https://ungradeedu.eu.cc";
const ORIGIN_VERIFY_HEADER = "x-ungrade-origin-verify";
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
  ORIGIN_VERIFY_HEADER,
  "x-forwarded-for",
  "x-forwarded-host",
  "x-forwarded-proto",
  "x-real-ip"
]);

const responseHeadersToDrop = new Set([
  "server",
  ORIGIN_VERIFY_HEADER,
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

function shouldDropResponseHeader(header: string) {
  const normalizedHeader = header.toLowerCase();
  return (
    responseHeadersToDrop.has(normalizedHeader) ||
    responseHeaderPrefixesToDrop.some((prefix) => normalizedHeader.startsWith(prefix))
  );
}

function normalizeOrigin(origin: string) {
  const normalized = new URL(origin);
  normalized.pathname = "";
  normalized.search = "";
  normalized.hash = "";
  return normalized;
}

function buildCanonicalRedirect(request: Request) {
  const incomingUrl = new URL(request.url);
  if (!canonicalRedirectHosts.has(incomingUrl.hostname.toLowerCase())) {
    return null;
  }

  const canonicalUrl = new URL(incomingUrl.pathname + incomingUrl.search, PRIMARY_PUBLIC_ORIGIN);
  return Response.redirect(canonicalUrl, 308);
}

function buildUpstreamRequest(
  request: Request,
  upstreamOrigin: URL,
  originVerifySecret?: string
) {
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
  if (originVerifySecret) {
    headers.set(ORIGIN_VERIFY_HEADER, originVerifySecret);
  }

  return new Request(upstreamUrl, {
    body: request.body,
    headers,
    method: request.method,
    redirect: "manual"
  });
}

function hardenResponse(response: Response) {
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
  async fetch(request: Request, env: Env): Promise<Response> {
    const canonicalRedirect = buildCanonicalRedirect(request);
    if (canonicalRedirect) {
      return canonicalRedirect;
    }

    if (!env.UPSTREAM_ORIGIN) {
      return new Response("Missing UPSTREAM_ORIGIN.", { status: 500 });
    }

    const upstreamOrigin = normalizeOrigin(env.UPSTREAM_ORIGIN);
    const upstreamRequest = buildUpstreamRequest(
      request,
      upstreamOrigin,
      env.ORIGIN_VERIFY_SECRET
    );
    const upstreamResponse = await fetch(upstreamRequest);

    return hardenResponse(upstreamResponse);
  }
};

export default worker;
