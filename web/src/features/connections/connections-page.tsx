import { ConnectionForm } from "./components/connection-form";
import { ConnectionsList } from "./components/connections-list";
import { useConnectionsPage } from "./hooks/use-connections-page";

interface ConnectionsPageProps {
  connectionsCount: number;
}

export function ConnectionsPage(props: ConnectionsPageProps) {
  const { connectionsCount } = props;
  const { cancelEdit, editConnection, editingConnection } =
    useConnectionsPage();

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <ConnectionForm
        connectionsCount={connectionsCount}
        editingConnection={editingConnection}
        onCancel={cancelEdit}
        onSaved={cancelEdit}
      />
      <ConnectionsList
        editingConnection={editingConnection}
        onEdit={editConnection}
        onDeletedEditingConnection={cancelEdit}
      />
    </div>
  );
}
