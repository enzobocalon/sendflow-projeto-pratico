import type { Timestamp } from "firebase/firestore";

export type Connection = {
  createdAt?: Timestamp;
  id: string;
  name: string;
  nameNormalized?: string;
  updatedAt?: Timestamp;
  userId: string;
};

export type ConnectionFormValues = {
  name: string;
};
