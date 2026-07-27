import { createCustomerServiceApiHandlers } from "@/server/customer-service-api";

const handlers = createCustomerServiceApiHandlers();

export const POST = handlers.POST;
