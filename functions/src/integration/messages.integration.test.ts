import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { call, createMissingId, createUserId } from "./test-helpers.ts";
import {
  createConnectionFixture,
  createContactFixture,
  createFutureDate,
  createMessage,
  createMessageFixture,
  db,
  deleteMessage,
  initializeIntegrationContext,
  terminateIntegrationContext,
  updateMessage,
} from "./test-context.ts";

beforeAll(initializeIntegrationContext);
afterAll(terminateIntegrationContext);

describe("Message Functions", () => {
  it("creates a sent message and prevents editing it afterward", async () => {
    const userId = createUserId();
    const connection = await createConnectionFixture(
      userId,
      "Conexão de Mensagens",
    );
    const contact = await createContactFixture(userId, connection.id, {
      name: "Contato da Mensagem",
    });
    const message = await createMessageFixture(
      userId,
      connection.id,
      [contact.id],
      { content: "Mensagem enviada" },
    );

    const messageSnapshot = await db
      .collection("messages")
      .doc(message.id)
      .get();
    expect(messageSnapshot.data()).toMatchObject({
      content: "Mensagem enviada",
      recipientsCount: 1,
      status: "sent",
      userId,
    });

    const updateRequest = call(updateMessage, userId, {
      connectionId: connection.id,
      contactIds: [contact.id],
      content: "Tentativa de alteração",
      messageId: message.id,
      status: "sent",
    });

    await expect(updateRequest).rejects.toMatchObject({
      code: "failed-precondition",
    });
  });

  it("rejects invalid message content", async () => {
    const userId = createUserId();

    const request = call(createMessage, userId, {
      connectionId: createMissingId(),
      contactIds: [],
      content: "A",
      status: "sent",
    });

    await expect(request).rejects.toMatchObject({
      code: "invalid-argument",
    });
  });

  it("updates a scheduled message to sent and adjusts its counter", async () => {
    const userId = createUserId();
    const connection = await createConnectionFixture(
      userId,
      "Conexão Agendada",
    );
    const contact = await createContactFixture(userId, connection.id, {
      name: "Contato Agendado",
    });
    const message = await createMessageFixture(
      userId,
      connection.id,
      [contact.id],
      {
        content: "Mensagem agendada",
        scheduledAt: createFutureDate(),
        status: "scheduled",
      },
    );

    const result = await call(updateMessage, userId, {
      connectionId: connection.id,
      contactIds: [contact.id],
      content: "Mensagem enviada agora",
      messageId: message.id,
      status: "sent",
    });
    const messageSnapshot = await db
      .collection("messages")
      .doc(message.id)
      .get();
    const usageSnapshot = await db.collection("usage").doc(userId).get();

    expect(result).toEqual({ id: message.id });
    expect(messageSnapshot.data()).toMatchObject({
      content: "Mensagem enviada agora",
      status: "sent",
    });
    expect(usageSnapshot.data()).toMatchObject({
      messagesCount: 1,
      scheduledMessagesCount: 0,
    });
  });

  it("rejects updating a missing message and invalid content", async () => {
    const userId = createUserId();
    const connection = await createConnectionFixture(
      userId,
      "Conexão de Edição",
    );
    const contact = await createContactFixture(userId, connection.id, {
      name: "Contato de Edição",
    });

    const missingMessageRequest = call(updateMessage, userId, {
      connectionId: connection.id,
      contactIds: [contact.id],
      content: "Mensagem válida",
      messageId: createMissingId(),
      status: "sent",
    });
    await expect(missingMessageRequest).rejects.toMatchObject({
      code: "permission-denied",
    });

    const invalidContentRequest = call(updateMessage, userId, {
      connectionId: connection.id,
      contactIds: [contact.id],
      content: "A",
      messageId: createMissingId(),
      status: "sent",
    });

    await expect(invalidContentRequest).rejects.toMatchObject({
      code: "invalid-argument",
    });
  });

  it("deletes sent and scheduled messages and updates counters", async () => {
    const userId = createUserId();
    const connection = await createConnectionFixture(
      userId,
      "Conexão de Exclusão",
    );
    const contact = await createContactFixture(userId, connection.id, {
      name: "Contato de Exclusão",
    });
    const sentMessage = await createMessageFixture(
      userId,
      connection.id,
      [contact.id],
      { content: "Mensagem enviada" },
    );
    const scheduledMessage = await createMessageFixture(
      userId,
      connection.id,
      [contact.id],
      {
        content: "Mensagem agendada",
        scheduledAt: createFutureDate(),
        status: "scheduled",
      },
    );

    await call(deleteMessage, userId, {
      messageId: sentMessage.id,
    });
    await call(deleteMessage, userId, {
      messageId: scheduledMessage.id,
    });
    const usageSnapshot = await db.collection("usage").doc(userId).get();

    const remainingMessages = await db
      .collection("messages")
      .where("userId", "==", userId)
      .get();

    expect(remainingMessages.empty).toBe(true);
    expect(usageSnapshot.data()).toMatchObject({
      messagesCount: 0,
      scheduledMessagesCount: 0,
    });

    const missingMessageRequest = call(deleteMessage, userId, {
      messageId: createMissingId(),
    });

    await expect(missingMessageRequest).rejects.toMatchObject({
      code: "permission-denied",
    });
  });
});
