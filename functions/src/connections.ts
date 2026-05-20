import { FieldValue } from "firebase-admin/firestore";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { db } from "./firebase";
import {
  MAX_CONNECTIONS_PER_USER,
  getAuthenticatedUserId,
  getStringField,
  normalizeSearchText,
} from "./utils";

export const createConnection = onCall(
  { region: "southamerica-east1" },
  async (request) => {
    const userId = request.auth?.uid;
    const name =
      typeof request.data?.name === "string" ? request.data.name.trim() : "";

    if (!userId) {
      throw new HttpsError(
        "unauthenticated",
        "Faça login para cadastrar uma conexão.",
      );
    }

    if (name.length < 2 || name.length > 80) {
      throw new HttpsError(
        "invalid-argument",
        "Informe um nome com 2 a 80 caracteres.",
      );
    }

    const connectionRef = db.collection("connections").doc();
    const usageRef = db.collection("usage").doc(userId);

    await db.runTransaction(async (transaction) => {
      const usageSnapshot = await transaction.get(usageRef);
      let connectionsCount = usageSnapshot.exists
        ? Number(usageSnapshot.data()?.connectionsCount ?? 0)
        : 0;

      if (
        !usageSnapshot.exists ||
        connectionsCount >= MAX_CONNECTIONS_PER_USER
      ) {
        const existingConnections = await transaction.get(
          db.collection("connections").where("userId", "==", userId).limit(101),
        );
        connectionsCount = existingConnections.size;
      }

      if (connectionsCount >= MAX_CONNECTIONS_PER_USER) {
        throw new HttpsError(
          "resource-exhausted",
          `Limite de ${MAX_CONNECTIONS_PER_USER} conexões atingido.`,
        );
      }

      const now = FieldValue.serverTimestamp();

      transaction.create(connectionRef, {
        createdAt: now,
        name,
        nameNormalized: normalizeSearchText(name),
        updatedAt: now,
        userId,
      });

      transaction.set(
        usageRef,
        {
          connectionsCount: FieldValue.increment(1),
          updatedAt: now,
          userId,
          ...(usageSnapshot.exists ? {} : { createdAt: now }),
        },
        { merge: true },
      );
    });

    return { id: connectionRef.id };
  },
);

export const updateConnection = onCall(
  { region: "southamerica-east1" },
  async (request) => {
    const userId = getAuthenticatedUserId(request.auth?.uid);
    const connectionId = getStringField(request.data?.connectionId);
    const name = getStringField(request.data?.name);
    const connectionRef = db.collection("connections").doc(connectionId);
    const connectionSnapshot = await connectionRef.get();

    if (
      !connectionSnapshot.exists ||
      connectionSnapshot.data()?.userId !== userId
    ) {
      throw new HttpsError("permission-denied", "Conexão inválida.");
    }

    if (name.length < 2 || name.length > 80) {
      throw new HttpsError(
        "invalid-argument",
        "Informe um nome com 2 a 80 caracteres.",
      );
    }

    await connectionRef.update({
      name,
      nameNormalized: normalizeSearchText(name),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { id: connectionId };
  },
);

export const deleteConnection = onCall(
  { region: "southamerica-east1" },
  async (request) => {
    const userId = getAuthenticatedUserId(request.auth?.uid);
    const connectionId = getStringField(request.data?.connectionId);
    const connectionRef = db.collection("connections").doc(connectionId);
    const connectionSnapshot = await connectionRef.get();

    if (
      !connectionSnapshot.exists ||
      connectionSnapshot.data()?.userId !== userId
    ) {
      throw new HttpsError("permission-denied", "Conexão inválida.");
    }

    const linkedContacts = await db
      .collection("contacts")
      .where("connectionId", "==", connectionId)
      .where("userId", "==", userId)
      .limit(1)
      .get();

    if (!linkedContacts.empty) {
      throw new HttpsError(
        "failed-precondition",
        "Não é possível excluir uma conexão com contatos vinculados.",
      );
    }

    const linkedMessages = await db
      .collection("messages")
      .where("connectionId", "==", connectionId)
      .where("userId", "==", userId)
      .limit(1)
      .get();

    if (!linkedMessages.empty) {
      throw new HttpsError(
        "failed-precondition",
        "Não é possível excluir uma conexão com mensagens vinculadas.",
      );
    }

    const usageRef = db.collection("usage").doc(userId);

    const batch = db.batch();
    batch.delete(connectionRef);
    batch.set(
      usageRef,
      { connectionsCount: FieldValue.increment(-1) },
      { merge: true },
    );
    await batch.commit();

    return { id: connectionId };
  },
);

export const syncConnectionNameInContacts = onDocumentUpdated(
  {
    document: "connections/{connectionId}",
    region: "southamerica-east1",
  },
  async (event) => {
    const beforeName = event.data?.before.data().name;
    const after = event.data?.after.data();
    const afterName = after?.name;
    const userId = after?.userId;

    if (
      typeof beforeName !== "string" ||
      typeof afterName !== "string" ||
      typeof userId !== "string" ||
      beforeName === afterName
    ) {
      return;
    }

    const contacts = await db
      .collection("contacts")
      .where("userId", "==", userId)
      .where("connectionId", "==", event.params.connectionId)
      .get();

    if (contacts.empty) {
      return;
    }

    const batch = db.batch();

    contacts.docs.forEach((contact) => {
      batch.update(contact.ref, {
        connectionName: afterName,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();
  },
);
