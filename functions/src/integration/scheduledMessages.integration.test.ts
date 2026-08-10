import { Timestamp } from "firebase-admin/firestore";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createUserId } from "./test-helpers.ts";
import {
  db,
  initializeIntegrationContext,
  terminateIntegrationContext,
} from "./test-context.ts";

let processDueScheduledMessages: (now?: Timestamp) => Promise<void>;

beforeAll(async () => {
  await initializeIntegrationContext();
  ({ processDueScheduledMessages } = await import("../scheduledMessages.ts"));
});

afterAll(terminateIntegrationContext);

describe("Scheduled message processing", () => {
  it("processes a due message only once during concurrent executions", async () => {
    const userId = createUserId();
    const messageRef = db.collection("messages").doc();
    const usageRef = db.collection("usage").doc(userId);
    const dueAt = Timestamp.fromMillis(Date.now() - 60_000);
    const processingTime = Timestamp.now();

    await Promise.all([
      messageRef.set({
        scheduledAt: dueAt,
        status: "scheduled",
        userId,
      }),
      usageRef.set({
        messagesCount: 1,
        scheduledMessagesCount: 1,
        userId,
      }),
    ]);

    await Promise.all([
      processDueScheduledMessages(processingTime),
      processDueScheduledMessages(processingTime),
    ]);

    const [messageSnapshot, usageSnapshot] = await Promise.all([
      messageRef.get(),
      usageRef.get(),
    ]);

    expect(messageSnapshot.data()).toMatchObject({
      sentAt: processingTime,
      status: "sent",
      updatedAt: processingTime,
    });
    expect(usageSnapshot.data()).toMatchObject({
      messagesCount: 1,
      scheduledMessagesCount: 0,
    });
  });
});
