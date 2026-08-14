import { NextRequest, NextResponse } from "next/server";

import {
  ORIGIN_VERIFY_HEADER,
  createOriginVerificationLog,
  evaluateOriginRequest,
  normalizeOriginVerificationMode
} from "./server/origin-request-verification";
import { evaluateWriteRequest } from "./server/security/request-guard";
import { createRedactedSecurityAudit } from "./server/security/security-observability";
import { readAuthSessionFromRequest } from "./server/auth-session";
import {
  createContentSecurityPolicy,
  createCspNonce
} from "./server/security/content-security-policy";

const ANONYMOUS_AUTH_WRITE_PATHS = new Set([
  "/api/auth/email/login",
  "/api/auth/email/send-code",
  "/api/auth/password/login",
  "/api/auth/password/reset"
]);

export function middleware(request: NextRequest) {
  const nonce = createCspNonce();

  if (!nonce) {
    return new NextResponse("Security configuration unavailable.", {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/plain; charset=utf-8"
      },
      status: 503
    });
  }

  const isProduction =
    process.env.APP_ENV === "production" || process.env.NODE_ENV === "production";
  const contentSecurityPolicy = createContentSecurityPolicy(nonce, {
    allowUnsafeEval: !isProduction
  });
  const withContentSecurityPolicy = (response: NextResponse) => {
    response.headers.set("Content-Security-Policy", contentSecurityPolicy);
    return response;
  };

  const mode = normalizeOriginVerificationMode(process.env.ORIGIN_VERIFY_MODE, {
    appEnv: process.env.APP_ENV,
    nodeEnv: process.env.NODE_ENV
  });
  const result = evaluateOriginRequest({
    mode,
    expectedSecret: process.env.ORIGIN_VERIFY_SECRET,
    previousSecret: process.env.ORIGIN_VERIFY_SECRET_PREVIOUS,
    providedSecret: request.headers.get(ORIGIN_VERIFY_HEADER)
  });

  if (mode !== "off") {
    console.warn(
      JSON.stringify(
        createOriginVerificationLog({
          method: request.method,
          pathname: request.nextUrl.pathname,
          result
        })
      )
    );
  }

  if (result.shouldReject) {
    return withContentSecurityPolicy(new NextResponse("Forbidden.", {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/plain; charset=utf-8"
      },
      status: 403
    }));
  }

  const allowsAnonymousAuthWrite =
    request.method === "POST" &&
    ANONYMOUS_AUTH_WRITE_PATHS.has(request.nextUrl.pathname);
  const sessionSubjectId = allowsAnonymousAuthWrite
    ? undefined
    : readAuthSessionFromRequest(request, process.env)?.userId;
  const allowsAnonymousFeedbackWrite =
    isProduction &&
    request.method === "POST" &&
    request.nextUrl.pathname === "/api/feedback" &&
    !sessionSubjectId;
  const writeGuard = evaluateWriteRequest({
    env: {
      allowedOrigins: process.env.ALLOWED_ORIGINS ??
        (process.env.NODE_ENV === "production" ? undefined : request.nextUrl.origin),
      csrfSecret: process.env.CSRF_SECRET,
      mode,
      appEnv: process.env.APP_ENV,
      nodeEnv: process.env.NODE_ENV,
      subjectId: sessionSubjectId,
      allowAnonymous: allowsAnonymousAuthWrite || allowsAnonymousFeedbackWrite
    },
    request
  });

  if (!writeGuard.ok) {
    console.warn(
      JSON.stringify(
        createRedactedSecurityAudit({
          correlationId: writeGuard.correlationId,
          event: "write_request_rejected",
          metadata: {
            method: request.method,
            pathname: request.nextUrl.pathname,
            reason: writeGuard.reason
          }
        })
      )
    );
    return withContentSecurityPolicy(new NextResponse("Forbidden.", {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/plain; charset=utf-8",
        "x-correlation-id": writeGuard.correlationId
      },
      status: 403
    }));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);
  // Next App Router reads the per-request nonce from the forwarded request
  // headers and applies it to its inline hydration scripts/styles. Keep the
  // nonce internal to the render request; never expose it in the response.
  requestHeaders.set("x-nonce", nonce);
  const response = NextResponse.next({
    request: { headers: requestHeaders }
  });
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);
  response.headers.set("x-correlation-id", writeGuard.correlationId);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
