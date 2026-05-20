import { FieldValue } from "firebase-admin/firestore";
import {
  onDocumentDeleted,
  onDocumentUpdated,
} from "firebase-functions/v2/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { db } from "./firebase";
import {
  MAX_CONNECTIONS_PER_USER,
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
    const usageRef = db.collection("usageLimits").doc(userId);

    await db.runTransaction(async (transaction) => {
      const usageSnapshot = await transaction.get(usageRef);
      let connectionsCount = usageSnapshot.exists
        ? Number(usageSnapshot.data()?.connectionsCount ?? 0)
        : 0;

      if (!usageSnapshot.exists || connectionsCount >= MAX_CONNECTIONS_PER_USER) {
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
          connectionsCount: connectionsCount + 1,
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

export const decrementConnectionUsage = onDocumentDeleted(
  {
    document: "connections/{connectionId}",
    region: "southamerica-east1",
  },
  async (event) => {
    const userId = event.data?.data().userId;

    if (typeof userId !== "string") {
      return;
    }

    await db
      .collection("usageLimits")
      .doc(userId)
      .set(
        {
          connectionsCount: FieldValue.increment(-1),
          updatedAt: FieldValue.serverTimestamp(),
          userId,
        },
        { merge: true },
      );
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
