import type { Timestamp } from "firebase/firestore";

export type Contact = {
  connectionId: string;
  connectionName?: string;
  createdAt?: Timestamp;
  id: string;
  name: string;
  nameNormalized?: string;
  phone: string;
  updatedAt?: Timestamp;
  userId: string;
};

export type ContactFormValues = {
  name: string;
  phone: string;
  connectionId: string;
};
