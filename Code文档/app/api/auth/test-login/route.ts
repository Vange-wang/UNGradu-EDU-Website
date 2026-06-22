import { createAuthApiHandlers } from "@/server/auth-api";

const handlers = createAuthApiHandlers();

export async function POST(request: Request) {
  return handlers.POST_TEST_LOGIN(request);
}
