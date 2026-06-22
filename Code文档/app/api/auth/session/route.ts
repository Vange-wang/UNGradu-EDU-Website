import { createAuthApiHandlers } from "@/server/auth-api";

const handlers = createAuthApiHandlers();

export async function GET(request: Request) {
  return handlers.GET_SESSION(request);
}
