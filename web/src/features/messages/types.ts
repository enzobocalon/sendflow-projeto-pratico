import type { Timestamp } from "firebase/firestore";

export type MessageStatus = "sent" | "scheduled";

export type Message = {
  connectionId: string;
  contactIds: string[];
  content: string;
  createdAt?: Timestamp;
  id: string;
  recipientsCount: number;
  scheduledAt?: Timestamp | null;
  sentAt?: Timestamp | null;
  status: MessageStatus;
  updatedAt?: Timestamp;
  userId: string;
};

export type MessageFormValues = {
  connectionId: string;
  contactIds: string[];
  content: string;
  scheduledDate: string;
  scheduledTime: string;
  sendMode: "now" | "scheduled";
};
