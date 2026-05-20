import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import {
  Alert,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { SectionTitle } from "../../dashboard/components/SectionTitle";
import type { Connection } from "../types";
import { DeleteDialog } from "../../../components/DeleteDialog";
import { useConnectionsList } from "./useConnectionsList";

type ConnectionsListProps = {
  connections: Connection[];
  connectionsError: string;
  editingConnection: Connection | null;
  isLoadingConnections: boolean;
  onEdit: (connection: Connection) => void;
  onDeletedEditingConnection: () => void;
};

export const ConnectionsList = ({
  connections: loadedConnections,
  connectionsError,
  editingConnection,
  isLoadingConnections,
  onEdit,
  onDeletedEditingConnection,
}: ConnectionsListProps) => {
  const {
    closeDeleteModal,
    confirmDeleteConnection,
    connectionToDelete,
    connections,
    error,
    isDeleting,
    isLoading,
    requestDeleteConnection,
    searchTerm,
    setSearchTerm,
    totalConnections,
  } = useConnectionsList({
    connections: loadedConnections,
    connectionsError,
    editingConnection,
    isLoadingConnections,
    onDeletedEditingConnection,
  });

  const subTitle =
    totalConnections === 0
      ? "Nenhuma conexão encontrada"
      : `${totalConnections} conex${totalConnections === 1 ? "ão" : "ões"} cadastrada${totalConnections === 1 ? "" : "s"}.`;

  return (
    <section>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <SectionTitle title="Lista de conexões" subtitle={subTitle} />
        <TextField
          size="small"
          label="Buscar conexão"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          disabled={isDeleting}
          className="md:w-52"
        />
      </div>

      {error && (
        <Alert severity="error" className="mb-4">
          {error}
        </Alert>
      )}

      {isLoading ? (
        <div className="grid min-h-40 place-items-center rounded-lg border border-dashed border-slate-200">
          <CircularProgress aria-label="Carregando conexões" />
        </div>
      ) : (
        <Stack spacing={1.5}>
          {connections.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center">
              <Typography className="font-medium text-slate-800">
                Nenhuma conexão encontrada
              </Typography>
              <Typography className="mt-1 text-sm text-slate-500">
                Cadastre a primeira conexão para começar a organizar contatos e
                mensagens.
              </Typography>
            </div>
          )}

          {connections.map((connection) => (
            <Paper
              key={connection.id}
              elevation={0}
              className="rounded-lg border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Typography className="font-semibold text-slate-900">
                    {connection.name}
                  </Typography>
                  <Typography className="mt-1 text-sm text-slate-500">
                    Conexão cadastrada
                  </Typography>
                </div>
                <Stack direction="row" spacing={0.5}>
                  <IconButton
                    aria-label="Editar conexão"
                    size="small"
                    onClick={() => onEdit(connection)}
                    disabled={isDeleting}
                  >
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    aria-label="Excluir conexão"
                    size="small"
                    onClick={() => requestDeleteConnection(connection)}
                    disabled={isDeleting}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </div>
            </Paper>
          ))}

        </Stack>
      )}

      <DeleteDialog
        title="Excluir conexão?"
        open={Boolean(connectionToDelete)}
        onClose={closeDeleteModal}
        onCancel={closeDeleteModal}
        onConfirm={confirmDeleteConnection}
        isLoading={isDeleting}
        message={`Tem certeza que deseja excluir a conexão "${connectionToDelete?.name}"? Esta ação não pode ser desfeita.`}
      />
    </section>
  );
};
