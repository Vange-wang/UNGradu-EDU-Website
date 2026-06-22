import { createCloudBaseServerApp } from "@/server/cloudbase-server";
import { createParentNeedApiHandlers } from "@/server/parent-need-api";
import { PARENT_NEEDS_COLLECTION } from "@/server/parent-needs";

const database = createCloudBaseServerApp().database();

const handlers = createParentNeedApiHandlers({
  collection: database.collection(PARENT_NEEDS_COLLECTION)
});

export const GET = handlers.GET_ITEM;
export const PATCH = handlers.PATCH_ITEM;
