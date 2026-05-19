import type { Timestamp } from "firebase/firestore";

export type Contact = {
  connectionId: string;
  createdAt?: Timestamp;
  id: string;
  name: string;
  phone: string;
  updatedAt?: Timestamp;
  userId: string;
};

export type ContactFormValues = {
  name: string;
  phone: string;
  connectionId: string;
}
