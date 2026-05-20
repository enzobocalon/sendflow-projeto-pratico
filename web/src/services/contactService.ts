import { httpsCallable } from "firebase/functions";
import { functions } from "../lib/firebase";

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

export const createContact = async ({
  connectionId,
  name,
  phone,
}: SaveContactParams) => {
  const createContactFunction = httpsCallable<
    {
      connectionId: string;
      name: string;
      phone: string;
    },
    { id: string }
  >(functions, "createContact");

  return createContactFunction({
    connectionId,
    name,
    phone,
  });
};

export const updateContact = async ({
  contactId,
  connectionId,
  name,
  phone,
}: UpdateContactParams) => {
  const updateContactFunction = httpsCallable<
    {
      contactId: string;
      connectionId: string;
      name: string;
      phone: string;
    },
    { id: string }
  >(functions, "updateContact");

  return updateContactFunction({
    contactId,
    connectionId,
    name,
    phone,
  });
};

export const deleteContact = (contactId: string) => {
  const deleteContactFunction = httpsCallable<
    { contactId: string },
    { id: string }
  >(functions, "deleteContact");

  return deleteContactFunction({ contactId });
};
