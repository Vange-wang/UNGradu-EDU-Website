import { randomUUID } from "node:crypto";

import { createAuthApiHandlers } from "@/server/auth-api";
import { createCloudBaseServerApp } from "@/server/cloudbase-server";
import { createRuntimeEnvWithSessionRevocation } from "@/server/api-utils";

function unavailable(correlationId: string) {
  return Response.json({
    errors: { request: "Request security is temporarily unavailable." },
    ok: false,
    value: null
  }, {
    headers: {
      "Cache-Control": "no-store",
      "x-correlation-id": correlationId
    },
    status: 503
  });
}

export async function GET(request: Request) {
  const correlationId = randomUUID();

  try {
    const database = createCloudBaseServerApp().database();
    const handlers = createAuthApiHandlers({
      env: createRuntimeEnvWithSessionRevocation(database)
    });
    const response = await handlers.GET_CSRF_PROOF(request);
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("x-correlation-id", correlationId);
    return response;
  } catch {
    return unavailable(correlationId);
  }
}
