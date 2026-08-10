export type MutationResponse = {
  id: string;
};

export type CreateConnectionRequest = {
  name?: string | number;
};

export type UpdateConnectionRequest = {
  connectionId?: string;
  name?: string;
};

export type DeleteConnectionRequest = {
  connectionId?: string;
};

export type CreateContactRequest = {
  connectionId?: string;
  name?: string;
  phone?: string;
};

export type UpdateContactRequest = CreateContactRequest & {
  contactId?: string;
};

export type DeleteContactRequest = {
  contactId?: string;
};

export type CreateMessageRequest = {
  connectionId?: string;
  contactIds?: string[];
  content?: string;
  scheduledAt?: string;
  status?: string;
};

export type UpdateMessageRequest = CreateMessageRequest & {
  messageId?: string;
};

export type DeleteMessageRequest = {
  messageId?: string;
};
