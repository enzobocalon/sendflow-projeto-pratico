import { FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { db } from "./firebase";
import {
  getAuthenticatedUserId,
  getOwnedConnection,
  getStringField,
  normalizeSearchText,
  sanitizePhone,
} from "./utils";

export const createContact = onCall(
  { region: "southamerica-east1" },
  async (request) => {
    const userId = getAuthenticatedUserId(request.auth?.uid);
    const connectionId = getStringField(request.data?.connectionId);
    const name = getStringField(request.data?.name);
    const phone = sanitizePhone(getStringField(request.data?.phone));

    if (name.length < 2 || name.length > 80) {
      throw new HttpsError(
        "invalid-argument",
        "Informe um nome com 2 a 80 caracteres.",
      );
    }

    if (phone.length < 10 || phone.length > 20) {
      throw new HttpsError("invalid-argument", "Informe um telefone válido.");
    }

    const connection = await getOwnedConnection(connectionId, userId);
    const now = FieldValue.serverTimestamp();
    const contactRef = await db.collection("contacts").add({
      connectionId: connection.id,
      connectionName: connection.name,
      createdAt: now,
      name,
      nameNormalized: normalizeSearchText(name),
      phone,
      updatedAt: now,
      userId,
    });

    return { id: contactRef.id };
  },
);

export const updateContact = onCall(
  { region: "southamerica-east1" },
  async (request) => {
    const userId = getAuthenticatedUserId(request.auth?.uid);
    const contactId = getStringField(request.data?.contactId);
    const connectionId = getStringField(request.data?.connectionId);
    const name = getStringField(request.data?.name);
    const phone = sanitizePhone(getStringField(request.data?.phone));
    const contactRef = db.collection("contacts").doc(contactId);
    const contactSnapshot = await contactRef.get();

    if (!contactSnapshot.exists || contactSnapshot.data()?.userId !== userId) {
      throw new HttpsError("permission-denied", "Contato inválido.");
    }

    if (name.length < 2 || name.length > 80) {
      throw new HttpsError(
        "invalid-argument",
        "Informe um nome com 2 a 80 caracteres.",
      );
    }

    if (phone.length < 10 || phone.length > 20) {
      throw new HttpsError("invalid-argument", "Informe um telefone válido.");
    }

    const connection = await getOwnedConnection(connectionId, userId);

    await contactRef.update({
      connectionId: connection.id,
      connectionName: connection.name,
      name,
      nameNormalized: normalizeSearchText(name),
      phone,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { id: contactId };
  },
);

export const deleteContact = onCall(
  { region: "southamerica-east1" },
  async (request) => {
    const userId = getAuthenticatedUserId(request.auth?.uid);
    const contactId = getStringField(request.data?.contactId);
    const contactRef = db.collection("contacts").doc(contactId);
    const contactSnapshot = await contactRef.get();

    if (!contactSnapshot.exists || contactSnapshot.data()?.userId !== userId) {
      throw new HttpsError("permission-denied", "Contato inválido.");
    }

    await contactRef.delete();

    return { id: contactId };
  },
);
