export const getContactsListSubtitle = (
  totalContacts: number,
  hasSearch: boolean,
) => {
  const plural = totalContacts === 1 ? "" : "s";
  return totalContacts === 0
    ? hasSearch
      ? "Nenhum contato encontrado."
      : "Nenhum contato cadastrado."
    : `${totalContacts} contato${plural} exibido${plural} nesta página.`;
};

export const getContactsListEmptyState = (hasSearch: boolean) => ({
  title: "Nenhum contato encontrado",
  description: hasSearch
    ? "Tente buscar por outro nome."
    : "Use o cadastro ao lado para vincular contatos a uma conexão antes de enviar mensagens.",
});
