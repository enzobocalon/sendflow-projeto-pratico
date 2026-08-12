import {
  MAX_CONNECTIONS_PER_USER,
  NAME_LENGTH_ERROR_MESSAGE,
  isValidName,
  normalizeSearchText,
} from "@sendflow/shared";
import {
  collection,
  doc,
  endAt,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAt,
  where,
  type DocumentData,
  type DocumentSnapshot,
  type FirestoreError,
  type QueryConstraint,
  type Transaction,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import {
  createFirestoreServiceError,
  requireAuthenticatedUserId,
} from "../../../lib/firestoreService";
import { updateUsageInTransaction } from "../../dashboard/services/usageService";
import type { Connection } from "../types";

type ConnectionDocument = Omit<Connection, "id">;

type CreateConnectionInput = Pick<Connection, "name">;

type UpdateConnectionInput = CreateConnectionInput & {
  connectionId: string;
};

type SubscribeToConnectionsParams = {
  onError: (error: FirestoreError) => void;
  onValue: (connections: Connection[]) => void;
  searchTerm?: string;
  userId: string;
};

const isActiveConnection = (data: DocumentData) => data.status !== "archived";

const mapConnectionDocument = (
  snapshot: DocumentSnapshot<DocumentData>,
): Connection => ({
  id: snapshot.id,
  ...(snapshot.data() as ConnectionDocument),
});

const assertOwnedConnection = (
  snapshot: DocumentSnapshot<DocumentData>,
  userId: string,
) => {
  const connection = snapshot.data();

  if (!snapshot.exists() || connection?.userId !== userId) {
    throw createFirestoreServiceError("permission-denied", "Conexão inválida.");
  }

  return mapConnectionDocument(snapshot);
};

const assertOwnedActiveConnection = (
  snapshot: DocumentSnapshot<DocumentData>,
  userId: string,
) => {
  const connection = assertOwnedConnection(snapshot, userId);

  if (!isActiveConnection(connection)) {
    throw createFirestoreServiceError("permission-denied", "Conexão inválida.");
  }

  return connection;
};

export const readActiveConnection = async (
  connectionId: string,
  userId: string,
) => {
  const snapshot = await getDoc(doc(db, "connections", connectionId));

  return assertOwnedActiveConnection(snapshot, userId);
};

export const readActiveConnectionInTransaction = async (
  transaction: Transaction,
  connectionId: string,
  userId: string,
) => {
  const snapshot = await transaction.get(doc(db, "connections", connectionId));

  return assertOwnedActiveConnection(snapshot, userId);
};

export const subscribeToConnections = ({
  onError,
  onValue,
  searchTerm = "",
  userId,
}: SubscribeToConnectionsParams) => {
  const normalizedSearchTerm = normalizeSearchText(searchTerm);
  const constraints: QueryConstraint[] = [
    where("userId", "==", userId),
    orderBy(normalizedSearchTerm ? "nameNormalized" : "name", "asc"),
  ];

  if (normalizedSearchTerm) {
    constraints.push(
      startAt(normalizedSearchTerm),
      endAt(`${normalizedSearchTerm}\uf8ff`),
    );
  }

  return onSnapshot(
    query(collection(db, "connections"), ...constraints),
    (snapshot) => {
      onValue(
        snapshot.docs
          .filter((document) => isActiveConnection(document.data()))
          .map(mapConnectionDocument),
      );
    },
    onError,
  );
};

export const countConnections = async (userId: string) => {
  const ownedConnections = query(
    collection(db, "connections"),
    where("userId", "==", userId),
  );
  const archivedConnections = query(
    ownedConnections,
    where("status", "==", "archived"),
  );
  const [total, archived] = await Promise.all([
    getCountFromServer(ownedConnections),
    getCountFromServer(archivedConnections),
  ]);

  return total.data().count - archived.data().count;
};

export const createConnection = async ({
  name: rawName,
}: CreateConnectionInput) => {
  const userId = requireAuthenticatedUserId(
    "Faça login para cadastrar uma conexão.",
  );
  const name = rawName.trim();

  if (!isValidName(name)) {
    throw createFirestoreServiceError(
      "invalid-argument",
      NAME_LENGTH_ERROR_MESSAGE,
    );
  }

  const connectionsCount = await countConnections(userId);
  if (connectionsCount >= MAX_CONNECTIONS_PER_USER) {
    throw createFirestoreServiceError(
      "resource-exhausted",
      `Limite de ${MAX_CONNECTIONS_PER_USER} conexões atingido.`,
    );
  }

  await runTransaction(db, async (transaction) => {
    const connectionRef = doc(collection(db, "connections"));
    const now = serverTimestamp();

    await updateUsageInTransaction(transaction, userId, {
      connectionsCount: 1,
    });
    transaction.set(connectionRef, {
      archivedAt: null,
      createdAt: now,
      name,
      nameNormalized: normalizeSearchText(name),
      status: "active",
      updatedAt: now,
      userId,
    });
  });
};

export const updateConnection = async ({
  connectionId,
  name: rawName,
}: UpdateConnectionInput) => {
  const userId = requireAuthenticatedUserId("Faça login para continuar.");
  const name = rawName.trim();

  if (!connectionId.trim()) {
    throw createFirestoreServiceError(
      "invalid-argument",
      "Informe uma conexão válida.",
    );
  }

  if (!isValidName(name)) {
    throw createFirestoreServiceError(
      "invalid-argument",
      NAME_LENGTH_ERROR_MESSAGE,
    );
  }

  await runTransaction(db, async (transaction) => {
    const connectionRef = doc(db, "connections", connectionId);

    await readActiveConnectionInTransaction(transaction, connectionId, userId);
    transaction.update(connectionRef, {
      archivedAt: null,
      name,
      nameNormalized: normalizeSearchText(name),
      status: "active",
      updatedAt: serverTimestamp(),
    });
  });
};

const hasLinkedResource = async (
  collectionName: "contacts" | "messages",
  connectionId: string,
  userId: string,
) => {
  const snapshot = await getDocs(
    query(
      collection(db, collectionName),
      where("userId", "==", userId),
      where("connectionId", "==", connectionId),
      limit(1),
    ),
  );

  return !snapshot.empty;
};

const getLinkedResourceError = async (connectionId: string, userId: string) => {
  const [hasContacts, hasMessages] = await Promise.all([
    hasLinkedResource("contacts", connectionId, userId),
    hasLinkedResource("messages", connectionId, userId),
  ]);

  if (hasContacts) {
    return "Não é possível excluir uma conexão com contatos vinculados.";
  }

  if (hasMessages) {
    return "Não é possível excluir uma conexão com mensagens vinculadas.";
  }

  return null;
};

const restoreArchivedConnection = (connectionId: string, userId: string) =>
  runTransaction(db, async (transaction) => {
    const connectionRef = doc(db, "connections", connectionId);
    const snapshot = await transaction.get(connectionRef);
    const connection = assertOwnedConnection(snapshot, userId);

    if (connection.status !== "archived") return;
    await updateUsageInTransaction(transaction, userId, {
      connectionsCount: 1,
    });
    transaction.update(connectionRef, {
      archivedAt: null,
      status: "active",
      updatedAt: serverTimestamp(),
    });
  });

export const deleteConnection = async (connectionId: string) => {
  const userId = requireAuthenticatedUserId("Faça login para continuar.");

  if (!connectionId.trim()) {
    throw createFirestoreServiceError(
      "invalid-argument",
      "Informe uma conexão válida.",
    );
  }

  const linkedResourceError = await getLinkedResourceError(
    connectionId,
    userId,
  );

  if (linkedResourceError) {
    throw createFirestoreServiceError(
      "failed-precondition",
      linkedResourceError,
    );
  }

  await runTransaction(db, async (transaction) => {
    const connectionRef = doc(db, "connections", connectionId);

    await readActiveConnectionInTransaction(transaction, connectionId, userId);
    await updateUsageInTransaction(transaction, userId, {
      connectionsCount: -1,
    });
    transaction.update(connectionRef, {
      archivedAt: serverTimestamp(),
      status: "archived",
      updatedAt: serverTimestamp(),
    });
  });

  const concurrentLinkError = await getLinkedResourceError(
    connectionId,
    userId,
  );

  if (concurrentLinkError) {
    await restoreArchivedConnection(connectionId, userId);
    throw createFirestoreServiceError(
      "failed-precondition",
      concurrentLinkError,
    );
  }
};
