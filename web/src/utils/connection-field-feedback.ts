interface ConnectionFieldFeedbackParams {
  connectionsError?: string;
  emptyMessage: string;
  fieldError?: string;
  hasConnections: boolean;
  isLoadingConnections: boolean;
}

export const getConnectionFieldFeedback = ({
  connectionsError,
  emptyMessage,
  fieldError,
  hasConnections,
  isLoadingConnections,
}: ConnectionFieldFeedbackParams) => ({
  error: Boolean(fieldError || connectionsError),
  message:
    fieldError ??
    connectionsError ??
    (!isLoadingConnections && !hasConnections ? emptyMessage : undefined),
});
