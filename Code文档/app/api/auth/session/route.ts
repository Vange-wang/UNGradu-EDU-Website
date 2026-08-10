import { createAuthApiHandlers } from "@/server/auth-api";
import { createCloudBaseServerApp } from "@/server/cloudbase-server";
import {
  createCloudBaseSessionRevocationStore,
  createSessionRevocationGuard
} from "@/server/security/session-revocation";
import { createRuntimeEnvWithSessionRevocation } from "@/server/api-utils";

function createHandlers() {
  try {
    const database = createCloudBaseServerApp().database();
    const store = createCloudBaseSessionRevocationStore(
      database.collection("auth_session_revocations")
    );
    return createAuthApiHandlers({
      env: createRuntimeEnvWithSessionRevocation(database),
      sessionRevocationGuard: createSessionRevocationGuard({
        activeKeyVersion: process.env.AUTH_SESSION_KEY_VERSION ?? "",
        store
      })
    });
  } catch {
    return createAuthApiHandlers();
  }
}

export async function GET(request: Request) {
  return createHandlers().GET_SESSION(request);
}
