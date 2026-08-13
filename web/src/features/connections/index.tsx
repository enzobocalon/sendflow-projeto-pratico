import { ConnectionForm } from "./components/connection-form";
import { ConnectionsList } from "./components/connections-list";
import { useConnectionsPage } from "./facades/use-connections-page";

export function ConnectionsPage() {
  const {
    cancelEdit,
    connections,
    connectionsError,
    editConnection,
    editingConnection,
    isLoadingConnections,
    totalConnections,
  } = useConnectionsPage();

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
