import { createAuthApiHandlers } from "@/server/auth-api";

const handlers = createAuthApiHandlers();

export async function POST() {
  return handlers.POST_LOGOUT();
}
