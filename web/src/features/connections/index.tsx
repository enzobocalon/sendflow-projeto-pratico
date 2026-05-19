import { ConnectionForm } from './components/ConnectionForm'
import { ConnectionsList } from './components/ConnectionsList'
import { useConnections } from './useConnections'

export const ConnectionsPage = () => {
  const {
    cancelEdit,
    editConnection,
    editingConnection,
  } = useConnections();

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <ConnectionForm
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
