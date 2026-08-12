import { ContactForm } from "./components/ContactForm";
import { ContactsList } from "./components/ContactList";
import { useContacts } from "./useContacts";

export const ContactsPage = () => {
  const { cancelEditContact, connectionsState, editContact, editingContact } =
    useContacts();

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <ContactForm
        connectionsState={connectionsState}
        editingContact={editingContact}
        onCancel={cancelEditContact}
        onSaved={cancelEditContact}
      />
      <ContactsList
        connectionsState={connectionsState}
        editContact={editContact}
        editingContact={editingContact}
        onDeletedEditingContact={cancelEditContact}
      />
    </div>
  );
};
