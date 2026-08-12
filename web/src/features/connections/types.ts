import type { Timestamp } from "firebase/firestore";

export type Connection = {
  archivedAt?: Timestamp | null;
  createdAt?: Timestamp;
  id: string;
  name: string;
  nameNormalized?: string;
  status?: "active" | "archived";
  updatedAt?: Timestamp;
  userId: string;
};

export type ConnectionFormValues = {
  name: string;
};

export type ConnectionsState = {
  connections: Connection[];
  error: string;
  isLoading: boolean;
};
