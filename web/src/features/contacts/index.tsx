import { ContactForm } from "./components/contact-form";
import { ContactsList } from "./components/contacts-list";
import { useContactsPage } from "./facades/use-contacts-page";

export function ContactsPage() {
  const { cancelEditContact, connectionsState, editContact, editingContact } =
    useContactsPage();

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
}
