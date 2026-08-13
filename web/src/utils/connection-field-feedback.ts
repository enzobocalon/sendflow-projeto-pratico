interface ConnectionFieldFeedbackParams {
  connectionsError?: string;
  emptyMessage: string;
  fieldError?: string;
  hasConnections: boolean;
  isLoadingConnections: boolean;
}

export function getConnectionFieldFeedback(
  params: ConnectionFieldFeedbackParams,
) {
  const {
    connectionsError,
    emptyMessage,
    fieldError,
    hasConnections,
    isLoadingConnections,
  } = params;

  return {
    error: Boolean(fieldError || connectionsError),
    message:
      fieldError ??
      connectionsError ??
      (!isLoadingConnections && !hasConnections ? emptyMessage : undefined),
  };
}
