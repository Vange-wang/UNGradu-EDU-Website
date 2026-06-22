import { createCloudBaseServerApp } from "@/server/cloudbase-server";
import { createTutorProfileApiHandlers } from "@/server/tutor-profile-api";
import { TUTOR_PROFILES_COLLECTION } from "@/server/tutor-profiles";

const database = createCloudBaseServerApp().database();

const handlers = createTutorProfileApiHandlers({
  collection: database.collection(TUTOR_PROFILES_COLLECTION)
});

export const GET = handlers.GET_ITEM;
