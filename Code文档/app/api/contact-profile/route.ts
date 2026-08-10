import {
  CONTACT_PROFILES_COLLECTION
} from "@/server/contact-profiles";
import { createContactProfileApiHandlers } from "@/server/contact-profile-api";
import { createCloudBaseServerApp } from "@/server/cloudbase-server";
import { createRuntimeEnvWithSessionRevocation } from "@/server/api-utils";

function createHandlers() {
  const database = createCloudBaseServerApp().database();
  return createContactProfileApiHandlers({
    collection: database.collection(CONTACT_PROFILES_COLLECTION),
    env: createRuntimeEnvWithSessionRevocation(database)
  });
}

export async function GET(request: Request) {
  return createHandlers().GET(request);
}

export async function PUT(request: Request) {
  return createHandlers().PUT(request);
}
