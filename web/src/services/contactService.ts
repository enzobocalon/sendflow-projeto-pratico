import type {
  CreateContactRequest,
  DeleteContactRequest,
  MutationResponse,
  UpdateContactRequest,
} from "@sendflow/shared";
import { callFirebaseFunction } from "./firebase-callable";

export const createContact = ({
  connectionId,
  name,
  phone,
}: CreateContactRequest) =>
  callFirebaseFunction<CreateContactRequest, MutationResponse>(
    "createContact",
    {
      connectionId,
      name,
      phone,
    },
  );

export const updateContact = ({
  contactId,
  connectionId,
  name,
  phone,
}: UpdateContactRequest) =>
  callFirebaseFunction<UpdateContactRequest, MutationResponse>(
    "updateContact",
    {
      contactId,
      connectionId,
      name,
      phone,
    },
  );

export const deleteContact = (contactId: string) =>
  callFirebaseFunction<DeleteContactRequest, MutationResponse>(
    "deleteContact",
    {
      contactId,
    },
  );
