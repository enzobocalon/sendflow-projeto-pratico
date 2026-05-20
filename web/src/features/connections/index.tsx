import { ConnectionForm } from './components/ConnectionForm'
import { ConnectionsList } from './components/ConnectionsList'
import { useConnections } from './useConnections'

export const ConnectionsPage = () => {
  const {
    cancelEdit,
    connections,
    connectionsError,
    editConnection,
    editingConnection,
    isLoadingConnections,
    totalConnections,
  } = useConnections();

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <ConnectionForm
        connectionsCount={totalConnections}
        editingConnection={editingConnection}
        onCancel={cancelEdit}
        onSaved={cancelEdit}
      />
      <ConnectionsList
        connections={connections}
        connectionsError={connectionsError}
        editingConnection={editingConnection}
        isLoadingConnections={isLoadingConnections}
        onEdit={editConnection}
        onDeletedEditingConnection={cancelEdit}
      />
    </div>
  );
}
