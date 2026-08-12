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

const seedScheduledMessages = async ({
  count = 1,
  scheduledAt,
  userId,
}: {
  count?: number;
  scheduledAt: Timestamp;
  userId: string | null;
}) => {
  const messageRefs = Array.from({ length: count }, () =>
    db.collection("messages").doc(),
  );
  const batch = db.batch();

  messageRefs.forEach((messageRef) => {
    batch.set(messageRef, { scheduledAt, status: "scheduled", userId });
  });
  await batch.commit();

  return messageRefs;
};

const seedUsage = (userId: string, scheduledMessagesCount: number) =>
  db.collection("usage").doc(userId).set({
    connectionsCount: 0,
    contactsCount: 0,
    createdAt: Timestamp.now(),
    messagesCount: scheduledMessagesCount,
    scheduledMessagesCount,
    updatedAt: Timestamp.now(),
    userId,
  });

beforeAll(async () => {
  await initializeIntegrationContext();
  ({ markScheduledMessagesAsSent, processDueScheduledMessages } =
    await import("../scheduledMessages.ts"));
});

afterAll(terminateIntegrationContext);

describe("processDueScheduledMessages", () => {
  it("ignores messages scheduled in the future", async () => {
    const processingTime = Timestamp.now();
    const futureScheduledAt = Timestamp.fromMillis(
      processingTime.toMillis() + DAY_MS,
    );
    const [futureMessageRef] = await seedScheduledMessages({
      scheduledAt: futureScheduledAt,
      userId: createUserId(),
    });

    await processDueScheduledMessages(processingTime);

    expect((await futureMessageRef.get()).data()).toEqual({
      scheduledAt: futureScheduledAt,
      status: "scheduled",
      userId: expect.any(String),
    });
  });

  it("processes a due message only once when executions overlap", async () => {
    const processingTime = Timestamp.now();
    const userId = createUserId();
    await seedUsage(userId, 1);
    const [messageRef] = await seedScheduledMessages({
      scheduledAt: processingTime,
      userId,
    });

    await Promise.all([
      processDueScheduledMessages(processingTime),
      processDueScheduledMessages(processingTime),
    ]);

    expect((await messageRef.get()).data()).toMatchObject({
      scheduledAt: processingTime,
      sentAt: processingTime,
      status: "sent",
      updatedAt: processingTime,
    });
    expect(
      (await db.collection("usage").doc(userId).get()).data(),
    ).toMatchObject({
      scheduledMessagesCount: 0,
      updatedAt: processingTime,
    });
  });

  it("processes due documents independently of optional owner metadata", async () => {
    const processingTime = Timestamp.now();
    const [messageRef] = await seedScheduledMessages({
      scheduledAt: processingTime,
      userId: null,
    });

    await processDueScheduledMessages(processingTime);

    expect((await messageRef.get()).data()).toMatchObject({
      sentAt: processingTime,
      status: "sent",
      updatedAt: processingTime,
      userId: null,
    });
  });

  it("updates each owner's usage independently", async () => {
    const firstUserId = createUserId();
    const secondUserId = createUserId();
    const userWithoutUsageId = createUserId();
    const processingTime = Timestamp.now();

    await Promise.all([
      seedUsage(firstUserId, 2),
      seedUsage(secondUserId, 1),
      seedScheduledMessages({
        count: 2,
        scheduledAt: processingTime,
        userId: firstUserId,
      }),
      seedScheduledMessages({
        scheduledAt: processingTime,
        userId: secondUserId,
      }),
      seedScheduledMessages({
        scheduledAt: processingTime,
        userId: userWithoutUsageId,
      }),
    ]);

    await processDueScheduledMessages(processingTime);

    const [firstUsage, secondUsage, missingUsage, untrackedMessages] =
      await Promise.all([
        db.collection("usage").doc(firstUserId).get(),
        db.collection("usage").doc(secondUserId).get(),
        db.collection("usage").doc(userWithoutUsageId).get(),
        db
          .collection("messages")
          .where("userId", "==", userWithoutUsageId)
          .get(),
      ]);

    expect(firstUsage.data()?.scheduledMessagesCount).toBe(0);
    expect(secondUsage.data()?.scheduledMessagesCount).toBe(0);
    expect(missingUsage.exists).toBe(false);
    expect(
      untrackedMessages.docs.every(
        (message) => message.data().status === "sent",
      ),
    ).toBe(true);
  });

  it("repairs a legacy usage without a scheduled counter", async () => {
    const userId = createUserId();
    const processingTime = Timestamp.now();

    await Promise.all([
      db.collection("usage").doc(userId).set({
        messagesCount: 1,
        userId,
      }),
      seedScheduledMessages({ scheduledAt: processingTime, userId }),
    ]);

    await processDueScheduledMessages(processingTime);

    expect(
      (await db.collection("usage").doc(userId).get()).data()
        ?.scheduledMessagesCount,
    ).toBe(0);
  });

  it("processes a backlog across bounded batches", async () => {
    const userId = createUserId();
    const processingTime = Timestamp.now();
    await seedUsage(userId, DUE_MESSAGES_BATCH_SIZE + 1);
    const messageRefs = await seedScheduledMessages({
      count: DUE_MESSAGES_BATCH_SIZE + 1,
      scheduledAt: processingTime,
      userId,
    });

    await processDueScheduledMessages(processingTime);

    const firstBatch = await db
      .collection("messages")
      .where("userId", "==", userId)
      .get();
    const firstBatchStatuses = firstBatch.docs.map(
      (message) => message.data().status,
    );

    expect(firstBatch.size).toBe(messageRefs.length);
    expect(
      firstBatchStatuses.filter((status) => status === "sent"),
    ).toHaveLength(DUE_MESSAGES_BATCH_SIZE);
    expect(
      firstBatchStatuses.filter((status) => status === "scheduled"),
    ).toHaveLength(1);
    expect(
      (await db.collection("usage").doc(userId).get()).data()
        ?.scheduledMessagesCount,
    ).toBe(1);

    await processDueScheduledMessages(processingTime);

    const remainingMessages = await db
      .collection("messages")
      .where("userId", "==", userId)
      .get();
    expect(
      remainingMessages.docs.every(
        (message) => message.data().status === "sent",
      ),
    ).toBe(true);
    expect(
      (await db.collection("usage").doc(userId).get()).data()
        ?.scheduledMessagesCount,
    ).toBe(0);
  });
});

describe("markScheduledMessagesAsSent", () => {
  it("invokes processing through the scheduled handler", async () => {
    const dueAt = Timestamp.fromMillis(Date.now() - MINUTE_MS);
    const [messageRef] = await seedScheduledMessages({
      scheduledAt: dueAt,
      userId: createUserId(),
    });

    await markScheduledMessagesAsSent.run({
      scheduleTime: new Date().toISOString(),
    });

    expect((await messageRef.get()).data()).toMatchObject({ status: "sent" });
  });
});
