export const getConnectionsListSubtitle = (totalConnections: number) => {
  const plural = totalConnections === 1 ? "" : "s";
  const connectionLabel = totalConnections === 1 ? "conexão" : "conexões";

  return totalConnections === 0
    ? "Nenhuma conexão encontrada"
    : `${totalConnections} ${connectionLabel} cadastrada${plural}.`;
};

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
