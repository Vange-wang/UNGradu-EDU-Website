import { createAuthApiHandlers } from "@/server/auth-api";
import { createCloudBaseServerApp } from "@/server/cloudbase-server";
import { createRuntimeEnvWithSessionRevocation } from "@/server/api-utils";

function createHandlers() {
  try {
    const database = createCloudBaseServerApp().database();
    return createAuthApiHandlers({ env: createRuntimeEnvWithSessionRevocation(database) });
  } catch {
    return createAuthApiHandlers();
  }
}

export async function POST(request: Request) {
  return createHandlers().POST_TEST_LOGIN(request);
}
