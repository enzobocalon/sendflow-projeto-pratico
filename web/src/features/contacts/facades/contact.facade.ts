import {
  createContact,
  upsertContact,
  type Contact,
} from "../models/contact.model";
import type { ContactFormValues } from "../schemas/contact.schema";

interface HandleSaveContactParams {
  editingContact: Contact | null;
  values: ContactFormValues;
}

export function handleSaveContact(params: HandleSaveContactParams) {
  const { editingContact, values } = params;

  if (editingContact) {
    return upsertContact({
      contactId: editingContact.id,
      connectionId: values.connectionId,
      name: values.name,
      phone: values.phone,
    });
  }

  return createContact(values);
}
