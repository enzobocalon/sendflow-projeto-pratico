import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { call, createMissingId, createUserId } from "./test-helpers.ts";
import {
  createConnectionFixture,
  createContact,
  createContactFixture,
  db,
  deleteContact,
  initializeIntegrationContext,
  terminateIntegrationContext,
  updateContact,
} from "./test-context.ts";

beforeAll(initializeIntegrationContext);
afterAll(terminateIntegrationContext);

describe("Contact Functions", () => {
  it("rejects invalid contact creation requests", async () => {
    const userId = createUserId();

    const invalidNameRequest = call(createContact, userId, {
      connectionId: createMissingId(),
      name: "A",
      phone: "11999999999",
    });

    await expect(invalidNameRequest).rejects.toMatchObject({
      code: "invalid-argument",
    });

    const invalidPhoneRequest = call(createContact, userId, {
      connectionId: createMissingId(),
      name: "Contato válido",
      phone: "123",
    });

    await expect(invalidPhoneRequest).rejects.toMatchObject({
      code: "invalid-argument",
    });
  });

  it("updates a contact and validates its fields and ownership", async () => {
    const userId = createUserId();
    const connection = await createConnectionFixture(
      userId,
      "Conexão de Atualização",
    );
    const contact = await createContactFixture(userId, connection.id, {
      name: "Nome Inicial",
    });

    const result = await call(updateContact, userId, {
      contactId: contact.id,
      connectionId: connection.id,
      name: "  Nome Atualizado  ",
      phone: "+55 (11) 98888-8888",
    });
    const updatedSnapshot = await db
      .collection("contacts")
      .doc(contact.id)
      .get();

    expect(result).toEqual({ id: contact.id });
    expect(updatedSnapshot.data()).toMatchObject({
      connectionId: connection.id,
      connectionName: "Conexão de Atualização",
      name: "Nome Atualizado",
      nameNormalized: "nome atualizado",
      phone: "5511988888888",
      userId,
    });

    const invalidNameRequest = call(updateContact, userId, {
      contactId: contact.id,
      connectionId: connection.id,
      name: "A",
      phone: "11999999999",
    });

    await expect(invalidNameRequest).rejects.toMatchObject({
      code: "invalid-argument",
    });

    const invalidPhoneRequest = call(updateContact, userId, {
      contactId: contact.id,
      connectionId: connection.id,
      name: "Nome válido",
      phone: "123",
    });

    await expect(invalidPhoneRequest).rejects.toMatchObject({
      code: "invalid-argument",
    });

    const foreignRequest = call(updateContact, createUserId(), {
      contactId: contact.id,
      connectionId: connection.id,
      name: "Outra conta",
      phone: "11999999999",
    });

    await expect(foreignRequest).rejects.toMatchObject({
      code: "permission-denied",
    });
  });

  it("rejects deleting a missing or foreign contact", async () => {
    const ownerId = createUserId();
    const connection = await createConnectionFixture(
      ownerId,
      "Conexão de Contato",
    );
    const contact = await createContactFixture(ownerId, connection.id, {
      name: "Contato protegido",
    });

    const missingRequest = call(deleteContact, ownerId, {
      contactId: createMissingId(),
    });

    await expect(missingRequest).rejects.toMatchObject({
      code: "permission-denied",
    });

    const foreignRequest = call(deleteContact, createUserId(), {
      contactId: contact.id,
    });

    await expect(foreignRequest).rejects.toMatchObject({
      code: "permission-denied",
    });
  });

  it("decrements the contact counter only once during concurrent deletion", async () => {
    const userId = createUserId();
    const connection = await createConnectionFixture(
      userId,
      "Conexão Concorrente",
    );
    const contact = await createContactFixture(userId, connection.id);

    const results = await Promise.allSettled([
      call(deleteContact, userId, { contactId: contact.id }),
      call(deleteContact, userId, { contactId: contact.id }),
    ]);
    const usageSnapshot = await db.collection("usage").doc(userId).get();

    expect(results.filter(({ status }) => status === "fulfilled")).toHaveLength(
      1,
    );
    expect(results.filter(({ status }) => status === "rejected")).toHaveLength(
      1,
    );
    expect(usageSnapshot.data()?.contactsCount).toBe(0);
  });
});
