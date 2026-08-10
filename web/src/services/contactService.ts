import {
  callFirebaseFunction,
  type MutationResponse,
} from "./firebase-callable";

type SaveContactParams = {
  connectionId: string;
  name: string;
  phone: string;
};

type UpdateContactParams = {
  contactId: string;
  connectionId: string;
  name: string;
  phone: string;
};

export const createContact = ({
  connectionId,
  name,
  phone,
}: SaveContactParams) =>
  callFirebaseFunction<SaveContactParams, MutationResponse>("createContact", {
    connectionId,
    name,
    phone,
  });

export const updateContact = ({
  contactId,
  connectionId,
  name,
  phone,
}: UpdateContactParams) =>
  callFirebaseFunction<UpdateContactParams, MutationResponse>("updateContact", {
    contactId,
    connectionId,
    name,
    phone,
  });

export const deleteContact = (contactId: string) =>
  callFirebaseFunction<{ contactId: string }, MutationResponse>(
    "deleteContact",
    {
      contactId,
    },
  );
