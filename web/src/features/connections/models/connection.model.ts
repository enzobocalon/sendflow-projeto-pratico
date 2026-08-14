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
  type CollectionReference,
  type DocumentData,
  type DocumentSnapshot,
  type FirestoreError,
  type QueryConstraint,
  type Timestamp,
  type Transaction,
} from "firebase/firestore";

import { collectionPaths } from "@/config/collection-paths";
import { db } from "@/lib/firebase";
import {
  createFirestoreError,
  requireAuthenticatedUserId,
} from "@/lib/firestore";
import { updateUsageInTransaction } from "@/models/usage.model";

export interface Connection {
  archivedAt?: Timestamp | null;
  createdAt?: Timestamp;
  id: string;
  name: string;
  nameNormalized?: string;
  status?: "active" | "archived";
  updatedAt?: Timestamp;
  userId: string;
}

type ConnectionDocument = Omit<Connection, "id">;

const connectionsCollection = collection(
  db,
  collectionPaths.connections,
) as CollectionReference<ConnectionDocument, ConnectionDocument>;

interface CreateConnectionInput {
  name: Connection["name"];
}

interface UpdateConnectionInput extends CreateConnectionInput {
  connectionId: string;
}

interface GetConnectionsRealtimeParams {
  onError: (error: FirestoreError) => void;
  onValue: (connections: Connection[]) => void;
  searchTerm?: string;
  userId: string;
}

interface GetConnectionsParams {
  searchTerm?: string;
  userId: string;
}

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
    throw createFirestoreError("permission-denied", "Conexão inválida.");
  }

  return mapConnectionDocument(snapshot);
};

const assertOwnedActiveConnection = (
  snapshot: DocumentSnapshot<DocumentData>,
  userId: string,
) => {
  const connection = assertOwnedConnection(snapshot, userId);

  if (!isActiveConnection(connection)) {
    throw createFirestoreError("permission-denied", "Conexão inválida.");
  }

  return connection;
};

export const getActiveConnection = async (
  connectionId: string,
  userId: string,
) => {
  const snapshot = await getDoc(doc(connectionsCollection, connectionId));

  return assertOwnedActiveConnection(snapshot, userId);
};

export const getConnection = async (connectionId: string, userId: string) => {
  const snapshot = await getDoc(doc(connectionsCollection, connectionId));

  return assertOwnedConnection(snapshot, userId);
};

export const getActiveConnectionInTransaction = async (
  transaction: Transaction,
  connectionId: string,
  userId: string,
) => {
  const snapshot = await transaction.get(
    doc(connectionsCollection, connectionId),
  );

  return assertOwnedActiveConnection(snapshot, userId);
};

const createConnectionsQuery = ({
  searchTerm = "",
  userId,
}: GetConnectionsParams) => {
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

  return query(connectionsCollection, ...constraints);
};

export const getConnections = async (params: GetConnectionsParams) => {
  const snapshot = await getDocs(createConnectionsQuery(params));

  return snapshot.docs
    .filter((document) => isActiveConnection(document.data()))
    .map(mapConnectionDocument);
};

export const getConnectionsRealtime = (
  params: GetConnectionsRealtimeParams,
) => {
  const { onError, onValue, searchTerm = "", userId } = params;

  return onSnapshot(
    createConnectionsQuery({ searchTerm, userId }),
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

export const getConnectionsCount = async (userId: string) => {
  const ownedConnections = query(
    connectionsCollection,
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

export const createConnection = async (params: CreateConnectionInput) => {
  const { name: rawName } = params;
  const userId = requireAuthenticatedUserId(
    "Faça login para cadastrar uma conexão.",
  );
  const name = rawName.trim();

  if (!isValidName(name)) {
    throw createFirestoreError("invalid-argument", NAME_LENGTH_ERROR_MESSAGE);
  }

  const connectionsCount = await getConnectionsCount(userId);
  if (connectionsCount >= MAX_CONNECTIONS_PER_USER) {
    throw createFirestoreError(
      "resource-exhausted",
      `Limite de ${MAX_CONNECTIONS_PER_USER} conexões atingido.`,
    );
  }

  await runTransaction(db, async (transaction) => {
    const connectionRef = doc(connectionsCollection);
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

export const upsertConnection = async (params: UpdateConnectionInput) => {
  const { connectionId, name: rawName } = params;
  const userId = requireAuthenticatedUserId("Faça login para continuar.");
  const name = rawName.trim();

  if (!connectionId.trim()) {
    throw createFirestoreError(
      "invalid-argument",
      "Informe uma conexão válida.",
    );
  }

  if (!isValidName(name)) {
    throw createFirestoreError("invalid-argument", NAME_LENGTH_ERROR_MESSAGE);
  }

  await runTransaction(db, async (transaction) => {
    const connectionRef = doc(connectionsCollection, connectionId);

    await getActiveConnectionInTransaction(transaction, connectionId, userId);
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
      collection(db, collectionPaths[collectionName]),
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
    const connectionRef = doc(connectionsCollection, connectionId);
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
    throw createFirestoreError(
      "invalid-argument",
      "Informe uma conexão válida.",
    );
  }

  const linkedResourceError = await getLinkedResourceError(
    connectionId,
    userId,
  );

  if (linkedResourceError) {
    throw createFirestoreError("failed-precondition", linkedResourceError);
  }

  await runTransaction(db, async (transaction) => {
    const connectionRef = doc(connectionsCollection, connectionId);

    await getActiveConnectionInTransaction(transaction, connectionId, userId);
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
    throw createFirestoreError("failed-precondition", concurrentLinkError);
  }
};
