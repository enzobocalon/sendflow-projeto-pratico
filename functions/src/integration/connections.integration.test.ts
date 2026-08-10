import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MAX_CONNECTIONS_PER_USER } from "@sendflow/shared";
import {
  call,
  callWithInvalidData,
  createCallableRequest,
  createConnectionUpdateEvent,
  createMissingId,
  createUserId,
} from "./test-helpers.ts";
import {
  createConnection,
  createConnectionFixture,
  createContactFixture,
  createMessageFixture,
  db,
  deleteConnection,
  deleteContact,
  getConnectionDocument,
  initializeIntegrationContext,
  syncConnectionNameInContacts,
  terminateIntegrationContext,
  updateConnection,
} from "./test-context.ts";

beforeAll(initializeIntegrationContext);
afterAll(terminateIntegrationContext);

describe("Connection Functions", () => {
  it("rejects unauthenticated and invalid connection creation requests", async () => {
    const invalidName = "A";

    const unauthenticatedRequest = createConnection.run(
      createCallableRequest({ name: "Conexão" }),
    );
    const invalidNameRequest = call(createConnection, createUserId(), {
      name: invalidName,
    });

    await expect(unauthenticatedRequest).rejects.toMatchObject({
      code: "unauthenticated",
    });
    await expect(invalidNameRequest).rejects.toMatchObject({
      code: "invalid-argument",
    });

    const invalidTypeRequest = callWithInvalidData(
      createConnection,
      createUserId(),
      {
        name: 123,
      },
    );

    await expect(invalidTypeRequest).rejects.toMatchObject({
      code: "invalid-argument",
    });
  });

  it("creates a connection with normalized data and usage counters", async () => {
    const userId = createUserId();
    await db.collection("usage").doc(userId).set({ userId });

    const result = await createConnectionFixture(
      userId,
      "  Atendimento Principal  ",
    );

    const connectionSnapshot = await db
      .collection("connections")
      .doc(result.id)
      .get();
    const usageSnapshot = await db.collection("usage").doc(userId).get();

    expect(connectionSnapshot.data()).toMatchObject({
      name: "Atendimento Principal",
      nameNormalized: "atendimento principal",
      userId,
    });
    expect(usageSnapshot.data()).toMatchObject({
      connectionsCount: 1,
      userId,
    });
  });

  it("updates a connection and rejects invalid or foreign updates", async () => {
    const userId = createUserId();
    const connection = await createConnectionFixture(userId, "Nome Inicial");

    const updateResult = await call(updateConnection, userId, {
      connectionId: connection.id,
      name: "  Nome Atualizado  ",
    });
    const updatedSnapshot = await db
      .collection("connections")
      .doc(connection.id)
      .get();

    expect(updateResult).toEqual({ id: connection.id });
    expect(updatedSnapshot.data()).toMatchObject({
      name: "Nome Atualizado",
      nameNormalized: "nome atualizado",
    });

    const invalidNameRequest = call(updateConnection, userId, {
      connectionId: connection.id,
      name: "A",
    });

    await expect(invalidNameRequest).rejects.toMatchObject({
      code: "invalid-argument",
    });

    const foreignRequest = call(updateConnection, createUserId(), {
      connectionId: connection.id,
      name: "Outra conta",
    });

    await expect(foreignRequest).rejects.toMatchObject({
      code: "permission-denied",
    });
  });

  it("rejects a connection when the user reaches the connection limit", async () => {
    const userId = createUserId();
    const batch = db.batch();

    for (let index = 0; index < MAX_CONNECTIONS_PER_USER; index += 1) {
      batch.set(db.collection("connections").doc(), {
        name: `Conexão ${index}`,
        userId,
      });
    }

    await batch.commit();
    await db.collection("usage").doc(userId).set({
      connectionsCount: MAX_CONNECTIONS_PER_USER,
      userId,
    });

    const request = call(createConnection, userId, {
      name: "Conexão excedente",
    });

    await expect(request).rejects.toMatchObject({
      code: "resource-exhausted",
    });
  });

  it("protects a connection with linked contacts and updates counters on deletion", async () => {
    const userId = createUserId();
    const connection = await createConnectionFixture(
      userId,
      "Conexão de Contatos",
    );
    const contact = await createContactFixture(userId, connection.id, {
      name: "  Ana  ",
      phone: "+55 (11) 99999-9999",
    });

    const contactSnapshot = await db
      .collection("contacts")
      .doc(contact.id)
      .get();
    expect(contactSnapshot.data()).toMatchObject({
      connectionId: connection.id,
      connectionName: "Conexão de Contatos",
      name: "Ana",
      phone: "5511999999999",
      userId,
    });

    const deleteBlockedRequest = call(deleteConnection, userId, {
      connectionId: connection.id,
    });

    await expect(deleteBlockedRequest).rejects.toMatchObject({
      code: "failed-precondition",
    });
    expect(contactSnapshot.exists).toBe(true);

    await call(deleteContact, userId, {
      contactId: contact.id,
    });
    await call(deleteConnection, userId, {
      connectionId: connection.id,
    });

    await expect(
      db.collection("connections").doc(connection.id).get(),
    ).resolves.toMatchObject({ exists: false });
    await expect(
      db.collection("contacts").doc(contact.id).get(),
    ).resolves.toMatchObject({ exists: false });
    const usageSnapshot = await db.collection("usage").doc(userId).get();
    expect(usageSnapshot.data()).toMatchObject({
      connectionsCount: 0,
      contactsCount: 0,
    });
  });

  it("prevents deleting a connection with linked messages", async () => {
    const userId = createUserId();
    const connection = await createConnectionFixture(
      userId,
      "Conexão com Mensagem",
    );
    const contact = await createContactFixture(userId, connection.id);
    await createMessageFixture(userId, connection.id, [contact.id], {
      content: "Mensagem vinculada",
    });

    await db.collection("contacts").doc(contact.id).delete();

    const request = call(deleteConnection, userId, {
      connectionId: connection.id,
    });

    await expect(request).rejects.toMatchObject({
      code: "failed-precondition",
    });
  });

  it("rejects deleting a missing connection", async () => {
    const missingConnectionId = createMissingId();

    const missingRequest = call(deleteConnection, createUserId(), {
      connectionId: missingConnectionId,
    });

    await expect(missingRequest).rejects.toMatchObject({
      code: "permission-denied",
    });
  });

  it("decrements the connection counter only once during concurrent deletion", async () => {
    const userId = createUserId();
    const connection = await createConnectionFixture(
      userId,
      "Conexão Concorrente",
    );

    const results = await Promise.allSettled([
      call(deleteConnection, userId, { connectionId: connection.id }),
      call(deleteConnection, userId, { connectionId: connection.id }),
    ]);
    const usageSnapshot = await db.collection("usage").doc(userId).get();

    expect(results.filter(({ status }) => status === "fulfilled")).toHaveLength(
      1,
    );
    expect(results.filter(({ status }) => status === "rejected")).toHaveLength(
      1,
    );
    expect(usageSnapshot.data()?.connectionsCount).toBe(0);
  });

  it("never creates an orphan contact during concurrent connection deletion", async () => {
    const userId = createUserId();
    const connection = await createConnectionFixture(
      userId,
      "Conexão em Disputa",
    );

    const results = await Promise.allSettled([
      call(deleteConnection, userId, { connectionId: connection.id }),
      createContactFixture(userId, connection.id, {
        name: "Contato Concorrente",
      }),
    ]);
    const connectionSnapshot = await db
      .collection("connections")
      .doc(connection.id)
      .get();
    const contactsSnapshot = await db
      .collection("contacts")
      .where("connectionId", "==", connection.id)
      .get();

    expect(results.filter(({ status }) => status === "fulfilled")).toHaveLength(
      1,
    );
    expect(connectionSnapshot.exists).toBe(!contactsSnapshot.empty);
  });

  it("syncs a connection name change to its contacts", async () => {
    const userId = createUserId();
    const connection = await createConnectionFixture(userId, "Nome Antigo");
    const contact = await createContactFixture(userId, connection.id);
    const before = await getConnectionDocument(connection.id);

    await call(updateConnection, userId, {
      connectionId: connection.id,
      name: "Nome Novo",
    });
    const after = await getConnectionDocument(connection.id);

    await syncConnectionNameInContacts.run(
      createConnectionUpdateEvent(before, after, connection.id),
    );

    const contactSnapshot = await db
      .collection("contacts")
      .doc(contact.id)
      .get();
    expect(contactSnapshot.data()).toMatchObject({
      connectionName: "Nome Novo",
    });
  });

  it("keeps the latest connection name when events arrive out of order", async () => {
    const userId = createUserId();
    const connection = await createConnectionFixture(userId, "Nome Inicial");
    const contact = await createContactFixture(userId, connection.id);
    const initialConnection = await getConnectionDocument(connection.id);

    await call(updateConnection, userId, {
      connectionId: connection.id,
      name: "Nome Intermediário",
    });
    const intermediateConnection = await getConnectionDocument(connection.id);

    await call(updateConnection, userId, {
      connectionId: connection.id,
      name: "Nome Atual",
    });
    const currentConnection = await getConnectionDocument(connection.id);

    await syncConnectionNameInContacts.run(
      createConnectionUpdateEvent(
        intermediateConnection,
        currentConnection,
        connection.id,
      ),
    );
    await syncConnectionNameInContacts.run(
      createConnectionUpdateEvent(
        initialConnection,
        intermediateConnection,
        connection.id,
      ),
    );

    const contactSnapshot = await db
      .collection("contacts")
      .doc(contact.id)
      .get();

    expect(contactSnapshot.data()?.connectionName).toBe("Nome Atual");
  });

  it("syncs contact names across more than one Firestore batch", async () => {
    const userId = createUserId();
    const connection = await createConnectionFixture(userId, "Nome em Lote");
    const before = await getConnectionDocument(connection.id);
    const contactsCount = 501;

    for (let offset = 0; offset < contactsCount; offset += 500) {
      const batch = db.batch();

      for (
        let index = offset;
        index < Math.min(offset + 500, contactsCount);
        index += 1
      ) {
        batch.set(db.collection("contacts").doc(), {
          connectionId: connection.id,
          connectionName: "Nome em Lote",
          name: `Contato ${index}`,
          userId,
        });
      }

      await batch.commit();
    }

    await call(updateConnection, userId, {
      connectionId: connection.id,
      name: "Nome Atualizado em Lote",
    });
    const after = await getConnectionDocument(connection.id);

    await syncConnectionNameInContacts.run(
      createConnectionUpdateEvent(before, after, connection.id),
    );

    const updatedContacts = await db
      .collection("contacts")
      .where("connectionId", "==", connection.id)
      .get();

    expect(updatedContacts.size).toBe(contactsCount);
    expect(
      updatedContacts.docs.every(
        (contact) =>
          contact.data().connectionName === "Nome Atualizado em Lote",
      ),
    ).toBe(true);
  });

  it.each([
    ["a missing previous name", { before: {}, after: { name: "Novo" } }],
    [
      "a missing new name",
      { before: { name: "Antigo" }, after: { userId: "user-1" } },
    ],
    [
      "a missing user id",
      { before: { name: "Antigo" }, after: { name: "Novo" } },
    ],
    [
      "an unchanged name",
      {
        before: { name: "Mesmo" },
        after: { name: "Mesmo", userId: "user-1" },
      },
    ],
  ])("ignores a connection event with %s", async (_description, change) => {
    const result = await syncConnectionNameInContacts.run(
      createConnectionUpdateEvent(
        change.before,
        change.after,
        "connection-test",
      ),
    );

    expect(result).toBeUndefined();
  });

  it("ignores a renamed connection without contacts", async () => {
    const userId = createUserId();
    const connection = await createConnectionFixture(userId, "Sem Contatos");
    const before = await getConnectionDocument(connection.id);

    await call(updateConnection, userId, {
      connectionId: connection.id,
      name: "Sem Contatos Atualizada",
    });
    const after = await getConnectionDocument(connection.id);

    const result = await syncConnectionNameInContacts.run(
      createConnectionUpdateEvent(before, after, connection.id),
    );

    expect(result).toBeUndefined();
  });

  it("does not update contacts when the connection no longer exists", async () => {
    const userId = createUserId();
    const connectionId = createMissingId();
    const contactRef = db.collection("contacts").doc();

    await contactRef.set({
      connectionId,
      connectionName: "Nome Antigo",
      name: "Contato Órfão",
      userId,
    });

    await syncConnectionNameInContacts.run(
      createConnectionUpdateEvent(
        { name: "Nome Antigo", userId },
        { name: "Nome Novo", userId },
        connectionId,
      ),
    );

    const contactSnapshot = await contactRef.get();

    expect(contactSnapshot.data()?.connectionName).toBe("Nome Antigo");
  });
});
