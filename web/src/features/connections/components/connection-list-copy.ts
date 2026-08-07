export const getConnectionsListSubtitle = (totalConnections: number) =>
  totalConnections === 0
    ? "Nenhuma conexão encontrada"
    : `${totalConnections} conex${totalConnections === 1 ? "ão" : "ões"} cadastrada${totalConnections === 1 ? "" : "s"}.`;

export const getConnectionsListEmptyState = (hasSearch: boolean) =>
  hasSearch
    ? {
        title: "Nenhuma conexão encontrada",
        description: "Tente buscar por outro nome de conexão.",
      }
    : {
        title: "Nenhuma conexão cadastrada",
        description:
          "Use o cadastro ao lado para criar a primeira conexão e começar a organizar contatos e mensagens.",
      };
