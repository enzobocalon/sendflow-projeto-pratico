import { randomUUID } from "node:crypto";

export const createUserId = () => `test-${randomUUID()}`;
