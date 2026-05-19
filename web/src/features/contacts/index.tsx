import { ContactForm } from "./components/ContactForm";
import { ContactsList } from "./components/ContactList";
import { useContacts } from "./useContacts";

export const ContactsPage = () => {
  const {
    control,
    errors,
    onSubmit,
    connections,
    connectionsError,
    isLoadingConnections,
    isSubmitting,
    formError,
    listError,
    contacts,
    isLoadingContacts,
    editContact,
    editingContact,
    cancelEditContact,
    contactToDelete,
    requestDeleteContact,
    closeDeleteModal,
    confirmDeleteContact,
    isDeletingContact,
    getConnectionName,
    searchTerm,
    setSearchTerm,
    totalContacts,
  } = useContacts();

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <ContactForm
        control={control}
        errors={errors}
        error={formError}
        handleSubmit={onSubmit}
        connections={connections}
        connectionsError={connectionsError}
        isLoadingConnections={isLoadingConnections}
        isSubmitting={isSubmitting}
        editingContact={editingContact}
        cancelEditContact={cancelEditContact}
      />
      <ContactsList
        contactToDelete={contactToDelete}
        contacts={contacts}
        editContact={editContact}
        editingContact={editingContact}
        error={listError}
        getConnectionName={getConnectionName}
        isDeleting={isDeletingContact}
        isLoading={isLoadingContacts}
        onCloseDeleteModal={closeDeleteModal}
        onConfirmDelete={confirmDeleteContact}
        onDelete={requestDeleteContact}
        onSearchChange={setSearchTerm}
        searchTerm={searchTerm}
        totalContacts={totalContacts}
      />
    </div>
  );
};
