import { NextRequest, NextResponse } from "next/server";

import {
  ORIGIN_VERIFY_HEADER,
  createOriginVerificationLog,
  evaluateOriginRequest,
  normalizeOriginVerificationMode
} from "./server/origin-request-verification";

export function middleware(request: NextRequest) {
  const mode = normalizeOriginVerificationMode(process.env.ORIGIN_VERIFY_MODE);
  const result = evaluateOriginRequest({
    mode,
    expectedSecret: process.env.ORIGIN_VERIFY_SECRET,
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
    return new NextResponse("Forbidden.", {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/plain; charset=utf-8"
      },
      status: 403
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
