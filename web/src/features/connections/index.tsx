import { ConnectionForm } from './components/ConnectionForm'
import { ConnectionsList } from './components/ConnectionsList'
import { useConnections } from './useConnections'

export const ConnectionsPage = () => {
  const {
    cancelEdit,
    closeDeleteModal,
    confirmDeleteConnection,
    connectionToDelete,
    connections,
    editConnection,
    editingConnection,
    formError,
    formErrors,
    formControl,
    isDeletingConnection,
    isSubmitting,
    listError,
    isLoading,
    requestDeleteConnection,
    searchTerm,
    setSearchTerm,
    submitConnection,
    totalConnections,
  } = useConnections();

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <ConnectionForm
        control={formControl}
        editingConnection={editingConnection}
        error={formError}
        errors={formErrors}
        isSubmitting={isSubmitting}
        onCancel={cancelEdit}
        onSubmit={submitConnection}
      />
      <ConnectionsList
        connectionToDelete={connectionToDelete}
        connections={connections}
        error={listError}
        isDeleting={isDeletingConnection}
        loading={isLoading}
        onCloseDeleteModal={closeDeleteModal}
        onConfirmDelete={confirmDeleteConnection}
        onDelete={requestDeleteConnection}
        onEdit={editConnection}
        onSearchChange={setSearchTerm}
        searchTerm={searchTerm}
        totalConnections={totalConnections}
      />
    </div>
  );
}
