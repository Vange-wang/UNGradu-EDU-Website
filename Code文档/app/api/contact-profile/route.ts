import {
  CONTACT_PROFILES_COLLECTION
} from "@/server/contact-profiles";
import { createContactProfileApiHandlers } from "@/server/contact-profile-api";
import { createCloudBaseServerApp } from "@/server/cloudbase-server";

function createHandlers() {
  return createContactProfileApiHandlers({
    collection: createCloudBaseServerApp()
      .database()
      .collection(CONTACT_PROFILES_COLLECTION)
  });
}

export async function GET(request: Request) {
  return createHandlers().GET(request);
}

export async function PUT(request: Request) {
  return createHandlers().PUT(request);
}
