export const MAX_CONNECTIONS_PER_USER = 100;
export const MAX_MESSAGE_CONTACTS = 100;

export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 80;
export const PHONE_MIN_LENGTH = 10;
export const PHONE_MAX_LENGTH = 15;
export const MESSAGE_CONTENT_MIN_LENGTH = 2;
export const MESSAGE_CONTENT_MAX_LENGTH = 500;

export const MESSAGE_STATUSES = ["sent", "scheduled"] as const;

export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

export type MutationResponse = {
  id: string;
};

export type CreateConnectionRequest = {
  name: string;
};

export type UpdateConnectionRequest = CreateConnectionRequest & {
  connectionId: string;
};

export type DeleteConnectionRequest = {
  connectionId: string;
};

export type CreateContactRequest = {
  connectionId: string;
  name: string;
  phone: string;
};

export type UpdateContactRequest = CreateContactRequest & {
  contactId: string;
};

export type DeleteContactRequest = {
  contactId: string;
};

export type CreateMessageRequest = {
  connectionId: string;
  contactIds: string[];
  content: string;
  scheduledAt?: string;
  status: MessageStatus;
};

export type UpdateMessageRequest = CreateMessageRequest & {
  messageId: string;
};

export type DeleteMessageRequest = {
  messageId: string;
};

export const normalizeSearchText = (value: string) =>
  value.trim().toLowerCase();

export const sanitizePhone = (value: string) => value.replace(/\D/g, "");

export const isRequiredString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export const isValidName = (value: string) => {
  const length = value.trim().length;

  return length >= NAME_MIN_LENGTH && length <= NAME_MAX_LENGTH;
};

export const isValidPhone = (value: string) => {
  const length = sanitizePhone(value).length;

  return length >= PHONE_MIN_LENGTH && length <= PHONE_MAX_LENGTH;
};

export const isValidMessageContent = (value: string) => {
  const length = value.trim().length;

  return (
    length >= MESSAGE_CONTENT_MIN_LENGTH && length <= MESSAGE_CONTENT_MAX_LENGTH
  );
};

export const isMessageStatus = (value: unknown): value is MessageStatus =>
  MESSAGE_STATUSES.some((status) => status === value);

export const parseDate = (value: unknown) => {
  if (typeof value !== "string" && typeof value !== "number") return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

export const isFutureDate = (date: Date, now = new Date()) => date > now;

export const hasUniqueValues = <Value>(values: Value[]) =>
  new Set(values).size === values.length;
