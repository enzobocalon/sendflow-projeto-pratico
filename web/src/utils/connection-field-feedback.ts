interface ConnectionFieldFeedbackParams {
  emptyMessage: string;
  fieldError?: string;
  hasConnections: boolean;
  isLoadingConnections: boolean;
}

export function getConnectionFieldFeedback(
  params: ConnectionFieldFeedbackParams,
) {
  const { emptyMessage, fieldError, hasConnections, isLoadingConnections } =
    params;

  return {
    error: Boolean(fieldError),
    message:
      fieldError ??
      (!isLoadingConnections && !hasConnections ? emptyMessage : undefined),
  };
}
