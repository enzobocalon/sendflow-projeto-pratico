import type { Timestamp } from "firebase/firestore";

export interface Contact {
  connectionId: string;
  createdAt?: Timestamp;
  id: string;
  name: string;
  nameNormalized?: string;
  phone: string;
  updatedAt?: Timestamp;
  userId: string;
}

export interface ContactFormValues {
  name: string;
  phone: string;
  connectionId: string;
}
