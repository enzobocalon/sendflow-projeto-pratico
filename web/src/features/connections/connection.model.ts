import { normalizeSearchText } from "@sendflow/shared";
import {
  collection,
  doc,
  endAt,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAt,
  updateDoc,
  where,
  type CollectionReference,
  type DocumentData,
  type DocumentSnapshot,
  type QueryConstraint,
  type Timestamp,
} from "firebase/firestore";

import { collectionPaths } from "@/config/collection-paths";
import { BusinessRuleError } from "@/errors/business-rule.error";
import { getHasContactsByConnection } from "@/features/contacts/contact.model";
import { getHasMessagesByConnection } from "@/features/messages/message.model";
import { updateUsageInTransaction } from "@/features/usage/usage.model";
import { db } from "@/lib/firebase";
import { requireAuthenticatedUserId } from "@/lib/firestore";

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
  onError: () => void;
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
    throw new Error("Conexão inválida.");
  }

  return mapConnectionDocument(snapshot);
};

const assertOwnedActiveConnection = (
  snapshot: DocumentSnapshot<DocumentData>,
  userId: string,
) => {
  const connection = assertOwnedConnection(snapshot, userId);

  if (!isActiveConnection(connection)) {
    throw new Error("Conexão inválida.");
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

export const createConnection = async (params: CreateConnectionInput) => {
  const { name: rawName } = params;
  const userId = requireAuthenticatedUserId();
  const name = rawName.trim();
  const connectionRef = doc(connectionsCollection);

  await runTransaction(db, async (transaction) => {
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
  requireAuthenticatedUserId();
  const name = rawName.trim();

  await updateDoc(doc(connectionsCollection, connectionId), {
    name,
    nameNormalized: normalizeSearchText(name),
    updatedAt: serverTimestamp(),
  });
};

const getLinkedResourceError = async (connectionId: string, userId: string) => {
  const [hasContacts, hasMessages] = await Promise.all([
    getHasContactsByConnection(connectionId, userId),
    getHasMessagesByConnection(connectionId, userId),
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
  const userId = requireAuthenticatedUserId();

  const linkedResourceError = await getLinkedResourceError(
    connectionId,
    userId,
  );

  if (linkedResourceError) {
    throw new BusinessRuleError(linkedResourceError);
  }

  const didArchive = await runTransaction(db, async (transaction) => {
    const connectionRef = doc(connectionsCollection, connectionId);
    const snapshot = await transaction.get(connectionRef);
    const connection = assertOwnedConnection(snapshot, userId);

    if (connection.status === "archived") return false;
    await updateUsageInTransaction(transaction, userId, {
      connectionsCount: -1,
    });
    transaction.update(connectionRef, {
      archivedAt: serverTimestamp(),
      status: "archived",
      updatedAt: serverTimestamp(),
    });
    return true;
  });

  if (!didArchive) return;

  const concurrentLinkError = await getLinkedResourceError(
    connectionId,
    userId,
  );

  if (concurrentLinkError) {
    await restoreArchivedConnection(connectionId, userId);
    throw new BusinessRuleError(concurrentLinkError);
  }
};
