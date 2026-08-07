export const getContactsListSubtitle = (
  totalContacts: number,
  hasSearch: boolean,
  hasMore: boolean,
) => {
  const plural = totalContacts === 1 ? "" : "s";
  return totalContacts === 0
    ? hasSearch
      ? "Nenhum contato encontrado."
      : "Nenhum contato cadastrado."
    : hasMore
      ? `${totalContacts} contato${plural} exibido${plural}.`
      : hasSearch
        ? `${totalContacts} contato${plural} encontrado${plural}.`
        : `${totalContacts} contato${plural} cadastrado${plural}.`;
};

export const getContactsListEmptyState = (hasSearch: boolean) => ({
  title: "Nenhum contato encontrado",
  description: hasSearch
    ? "Tente buscar por outro nome."
    : "Use o cadastro ao lado para vincular contatos a uma conexão antes de enviar mensagens.",
});
