import { Timestamp } from "firebase-admin/firestore";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createUserId } from "./test-helpers.ts";
import {
  db,
  initializeIntegrationContext,
  terminateIntegrationContext,
} from "./test-context.ts";

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;
const DUE_MESSAGES_BATCH_SIZE = 250;

let processDueScheduledMessages: (now?: Timestamp) => Promise<void>;
let markScheduledMessagesAsSent: (typeof import("../scheduledMessages.ts"))["markScheduledMessagesAsSent"];

const readUsageState = async () => {
  const snapshot = await db.collection("usage").get();

  return snapshot.docs
    .map((document) => ({ data: document.data(), id: document.id }))
    .sort((first, second) => first.id.localeCompare(second.id));
};

const seedScheduledMessages = async ({
  count = 1,
  scheduledAt,
  userId,
}: {
  count?: number;
  scheduledAt: Timestamp;
  userId: string;
}) => {
  const messageRefs = Array.from({ length: count }, () =>
    db.collection("messages").doc(),
  );
  const usageRef = db.collection("usage").doc(userId);
  const batch = db.batch();

  messageRefs.forEach((messageRef) => {
    batch.set(messageRef, { scheduledAt, status: "scheduled", userId });
  });
  batch.set(usageRef, {
    messagesCount: count,
    scheduledMessagesCount: count,
    userId,
  });
  await batch.commit();

  return { messageRefs, usageRef };
};

beforeAll(async () => {
  await initializeIntegrationContext();
  ({ markScheduledMessagesAsSent, processDueScheduledMessages } =
    await import("../scheduledMessages.ts"));
});

afterAll(terminateIntegrationContext);

describe("processDueScheduledMessages", () => {
  it("ignores messages scheduled in the future", async () => {
    const userId = createUserId();
    const processingTime = Timestamp.now();
    const futureScheduledAt = Timestamp.fromMillis(
      processingTime.toMillis() + DAY_MS,
    );
    const {
      messageRefs: [futureMessageRef],
      usageRef: futureUsageRef,
    } = await seedScheduledMessages({
      scheduledAt: futureScheduledAt,
      userId,
    });

    await processDueScheduledMessages(processingTime);

    const [futureMessage, futureUsage] = await Promise.all([
      futureMessageRef.get(),
      futureUsageRef.get(),
    ]);

    expect(futureMessage.data()).toEqual({
      scheduledAt: futureScheduledAt,
      status: "scheduled",
      userId,
    });
    expect(futureUsage.data()).toEqual({
      messagesCount: 1,
      scheduledMessagesCount: 1,
      userId,
    });
  });

  it("processes a due message only once when executions overlap", async () => {
    const userId = createUserId();
    const processingTime = Timestamp.now();
    const {
      messageRefs: [messageRef],
      usageRef,
    } = await seedScheduledMessages({ scheduledAt: processingTime, userId });

    await Promise.all([
      processDueScheduledMessages(processingTime),
      processDueScheduledMessages(processingTime),
    ]);

    const [messageSnapshot, usageSnapshot] = await Promise.all([
      messageRef.get(),
      usageRef.get(),
    ]);

    expect(messageSnapshot.data()).toMatchObject({
      scheduledAt: processingTime,
      sentAt: processingTime,
      status: "sent",
      updatedAt: processingTime,
      userId,
    });
    expect(usageSnapshot.data()).toMatchObject({
      messagesCount: 1,
      scheduledMessagesCount: 0,
    });
  });

  it("marks malformed due messages but only decrements valid owners", async () => {
    const validUserId = createUserId();
    const processingTime = Timestamp.now();
    const { usageRef: validUsageRef } = await seedScheduledMessages({
      scheduledAt: processingTime,
      userId: validUserId,
    });
    const usageBeforeProcessing = await readUsageState();
    const malformedMessageRef = db.collection("messages").doc();

    await malformedMessageRef.set({
      scheduledAt: processingTime,
      status: "scheduled",
      userId: null,
    });

    await processDueScheduledMessages(processingTime);

    const [malformedMessage, validUsage, usageAfterProcessing] =
      await Promise.all([
        malformedMessageRef.get(),
        validUsageRef.get(),
        readUsageState(),
      ]);

    expect(malformedMessage.data()).toMatchObject({
      scheduledAt: processingTime,
      sentAt: processingTime,
      status: "sent",
      updatedAt: processingTime,
      userId: null,
    });
    expect(validUsage.data()).toMatchObject({
      messagesCount: 1,
      scheduledMessagesCount: 0,
      userId: validUserId,
    });
    expect(usageAfterProcessing.filter(({ id }) => id !== validUserId)).toEqual(
      usageBeforeProcessing.filter(({ id }) => id !== validUserId),
    );
  });

  it("processes a backlog across bounded batches", async () => {
    const userId = createUserId();
    const processingTime = Timestamp.now();
    const { messageRefs, usageRef } = await seedScheduledMessages({
      count: DUE_MESSAGES_BATCH_SIZE + 1,
      scheduledAt: processingTime,
      userId,
    });

    await processDueScheduledMessages(processingTime);

    const [firstBatchMessages, usageAfterFirstBatch] = await Promise.all([
      db.collection("messages").where("userId", "==", userId).get(),
      usageRef.get(),
    ]);
    const firstBatchStatuses = firstBatchMessages.docs.map(
      (message) => message.data().status,
    );

    expect(firstBatchMessages.size).toBe(messageRefs.length);
    expect(
      firstBatchStatuses.filter((status) => status === "sent"),
    ).toHaveLength(DUE_MESSAGES_BATCH_SIZE);
    expect(
      firstBatchStatuses.filter((status) => status === "scheduled"),
    ).toHaveLength(1);
    expect(usageAfterFirstBatch.data()).toMatchObject({
      scheduledMessagesCount: 1,
    });

    await processDueScheduledMessages(processingTime);

    const [remainingMessages, usageAfterSecondBatch] = await Promise.all([
      db.collection("messages").where("userId", "==", userId).get(),
      usageRef.get(),
    ]);

    expect(
      remainingMessages.docs.every(
        (message) => message.data().status === "sent",
      ),
    ).toBe(true);
    expect(usageAfterSecondBatch.data()).toMatchObject({
      scheduledMessagesCount: 0,
    });
  });

  it("decrements usage independently per user", async () => {
    const firstUserId = createUserId();
    const secondUserId = createUserId();
    const processingTime = Timestamp.now();
    const [firstUserBatch, secondUserBatch] = await Promise.all([
      seedScheduledMessages({
        count: 2,
        scheduledAt: processingTime,
        userId: firstUserId,
      }),
      seedScheduledMessages({
        scheduledAt: processingTime,
        userId: secondUserId,
      }),
    ]);

    await processDueScheduledMessages(processingTime);

    const [firstUserUsage, secondUserUsage] = await Promise.all([
      firstUserBatch.usageRef.get(),
      secondUserBatch.usageRef.get(),
    ]);

    expect(firstUserUsage.data()).toMatchObject({
      messagesCount: 2,
      scheduledMessagesCount: 0,
    });
    expect(secondUserUsage.data()).toMatchObject({
      messagesCount: 1,
      scheduledMessagesCount: 0,
    });
  });
});

describe("markScheduledMessagesAsSent", () => {
  it("invokes processDueScheduledMessages through the scheduled handler", async () => {
    const userId = createUserId();
    const dueAt = Timestamp.fromMillis(Date.now() - MINUTE_MS);
    const { messageRefs, usageRef } = await seedScheduledMessages({
      scheduledAt: dueAt,
      userId,
    });

    await markScheduledMessagesAsSent.run({
      scheduleTime: new Date().toISOString(),
    });

    const [messageSnapshot, usageSnapshot] = await Promise.all([
      messageRefs[0].get(),
      usageRef.get(),
    ]);

    expect(messageSnapshot.data()).toMatchObject({ status: "sent" });
    expect(usageSnapshot.data()).toMatchObject({ scheduledMessagesCount: 0 });
  });
});