import type { Timestamp } from "firebase/firestore";

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

export interface ConnectionFormValues {
  name: string;
}

export interface ConnectionsState {
  connections: Connection[];
  error: string;
  isLoading: boolean;
}
