import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { EmptyState } from "@/components/empty-state";
import { PaginatedContent } from "@/components/paginated-content";
import { SectionTitle } from "@/features/dashboard/components/section-title";

import { useConnectionsList } from "../hooks/use-connections-list";
import type { Connection } from "../connections.model";
import {
  getConnectionsListEmptyState,
  getConnectionsListSubtitle,
} from "./connections-list-copy";

interface ConnectionsListProps {
  editingConnection: Connection | null;
  onEdit: (connection: Connection) => void;
  onDeletedEditingConnection: () => void;
}

export function ConnectionsList(props: ConnectionsListProps) {
  const { editingConnection, onEdit, onDeletedEditingConnection } = props;

  const { state, actions } = useConnectionsList({
    editingConnection,
    onDeletedEditingConnection,
  });

  const hasSearch = Boolean(state.searchTerm.trim());
  const subtitle = getConnectionsListSubtitle(state.totalConnections);
  const emptyState = getConnectionsListEmptyState(hasSearch);

  return (
    <section>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <SectionTitle title="Lista de conexões" subtitle={subtitle} />
        <TextField
          size="small"
          label="Buscar conexão"
          value={state.searchTerm}
          onChange={(event) => actions.setSearchTerm(event.target.value)}
          disabled={state.isDeleting}
          className="md:w-52"
        />
      </div>

      {state.isLoading ? (
        <div className="grid min-h-40 place-items-center rounded-lg border border-dashed border-slate-200">
          <CircularProgress aria-label="Carregando conexões" />
        </div>
      ) : (
        <PaginatedContent
          contentLabel="conexões"
          currentPage={state.currentPage}
          disabled={state.isDeleting}
          hasNextPage={state.hasNextPage}
          hasPreviousPage={state.hasPreviousPage}
          isLoading={state.isPageChanging}
          loadingLabel="Carregando conexões da próxima página"
          onNextPage={actions.goToNextPage}
          onPreviousPage={actions.goToPreviousPage}
        >
          <Stack spacing={1.5}>
            {state.connections.length === 0 && <EmptyState {...emptyState} />}

            {state.connections.map((connection) => (
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
                      disabled={state.isDeleting}
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      aria-label="Excluir conexão"
                      size="small"
                      onClick={() =>
                        actions.requestDeleteConnection(connection)
                      }
                      disabled={state.isDeleting}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </div>
              </Paper>
            ))}
          </Stack>
        </PaginatedContent>
      )}
    </section>
  );
}
