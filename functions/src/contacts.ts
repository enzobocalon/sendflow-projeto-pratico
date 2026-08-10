import { FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { db } from "./firebase";
import {
  isValidName,
  isValidPhone,
  normalizeSearchText,
  sanitizePhone,
  type CreateContactRequest,
  type DeleteContactRequest,
  type UpdateContactRequest,
} from "@sendflow/shared";
import {
  getAuthenticatedUserId,
  getOwnedConnection,
  getRequiredStringField,
  getStringField,
} from "./utils";

export const createContact = onCall<CreateContactRequest>(
  { region: "southamerica-east1" },
  async (request) => {
    const userId = getAuthenticatedUserId(request.auth?.uid);
    const connectionId = getRequiredStringField(
      request.data?.connectionId,
      "Informe uma conexão válida.",
    );
    const name = getStringField(request.data?.name);
    const phone = sanitizePhone(getStringField(request.data?.phone));

    if (!isValidName(name)) {
      throw new HttpsError(
        "invalid-argument",
        "Informe um nome com 2 a 80 caracteres.",
      );
    }

    if (!isValidPhone(phone)) {
      throw new HttpsError("invalid-argument", "Informe um telefone válido.");
    }

    const now = FieldValue.serverTimestamp();
    const contactRef = db.collection("contacts").doc();
    const usageRef = db.collection("usage").doc(userId);

    await db.runTransaction(async (transaction) => {
      const connection = await getOwnedConnection(
        connectionId,
        userId,
        transaction,
      );

      transaction.create(contactRef, {
        connectionId: connection.id,
        connectionName: connection.name,
        createdAt: now,
        name,
        nameNormalized: normalizeSearchText(name),
        phone,
        updatedAt: now,
        userId,
      });
      transaction.set(
        usageRef,
        { contactsCount: FieldValue.increment(1) },
        { merge: true },
      );
    });

    return { id: contactRef.id };
  },
);

export const updateContact = onCall<UpdateContactRequest>(
  { region: "southamerica-east1" },
  async (request) => {
    const userId = getAuthenticatedUserId(request.auth?.uid);
    const contactId = getRequiredStringField(
      request.data?.contactId,
      "Informe um contato válido.",
    );
    const connectionId = getRequiredStringField(
      request.data?.connectionId,
      "Informe uma conexão válida.",
    );
    const name = getStringField(request.data?.name);
    const phone = sanitizePhone(getStringField(request.data?.phone));
    const contactRef = db.collection("contacts").doc(contactId);
    if (!isValidName(name)) {
      throw new HttpsError(
        "invalid-argument",
        "Informe um nome com 2 a 80 caracteres.",
      );
    }

    if (!isValidPhone(phone)) {
      throw new HttpsError("invalid-argument", "Informe um telefone válido.");
    }

    await db.runTransaction(async (transaction) => {
      const contactSnapshot = await transaction.get(contactRef);

      if (
        !contactSnapshot.exists ||
        contactSnapshot.data()?.userId !== userId
      ) {
        throw new HttpsError("permission-denied", "Contato inválido.");
      }

      const connection = await getOwnedConnection(
        connectionId,
        userId,
        transaction,
      );

      transaction.update(contactRef, {
        connectionId: connection.id,
        connectionName: connection.name,
        name,
        nameNormalized: normalizeSearchText(name),
        phone,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    return { id: contactId };
  },
);

export const deleteContact = onCall<DeleteContactRequest>(
  { region: "southamerica-east1" },
  async (request) => {
    const userId = getAuthenticatedUserId(request.auth?.uid);
    const contactId = getRequiredStringField(
      request.data?.contactId,
      "Informe um contato válido.",
    );
    const contactRef = db.collection("contacts").doc(contactId);
    const usageRef = db.collection("usage").doc(userId);

    await db.runTransaction(async (transaction) => {
      const contactSnapshot = await transaction.get(contactRef);

      if (
        !contactSnapshot.exists ||
        contactSnapshot.data()?.userId !== userId
      ) {
        throw new HttpsError("permission-denied", "Contato inválido.");
      }

      transaction.delete(contactRef);
      transaction.set(
        usageRef,
        { contactsCount: FieldValue.increment(-1) },
        { merge: true },
      );
    });

    return { id: contactId };
  },
);
