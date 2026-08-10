import { ContactForm } from "./components/ContactForm";
import { ContactsList } from "./components/ContactList";
import { useContacts } from "./useContacts";

export const ContactsPage = () => {
  const { editContact, editingContact, cancelEditContact } = useContacts();

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <ContactForm
        editingContact={editingContact}
        onCancel={cancelEditContact}
        onSaved={cancelEditContact}
      />
      <ContactsList
        editContact={editContact}
        editingContact={editingContact}
        onDeletedEditingContact={cancelEditContact}
      />
    </div>
  );
};
