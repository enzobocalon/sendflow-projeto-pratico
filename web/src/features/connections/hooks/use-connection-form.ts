import { zodResolver } from "@hookform/resolvers/zod";
import { MAX_CONNECTIONS_PER_USER } from "@sendflow/shared";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { getBusinessRuleErrorMessage } from "@/errors/business-rule.error";
import { useFeedback } from "@/providers/feedback/use-feedback";

import { handleSaveConnection } from "../connections.facade";
import type { Connection } from "../connections.model";
import {
  connectionSchema,
  type ConnectionFormValues,
} from "../connections.schema";

interface UseConnectionFormParams {
  connectionsCount: number;
  editingConnection: Connection | null;
  onSaved: () => void;
}

const connectionsLimitError = `Limite de ${MAX_CONNECTIONS_PER_USER} conexões atingido.`;

export function useConnectionForm(params: UseConnectionFormParams) {
  const { connectionsCount, editingConnection, onSaved } = params;
  const { showError, showSuccess } = useFeedback();
  const hasReachedConnectionsLimit =
    !editingConnection && connectionsCount >= MAX_CONNECTIONS_PER_USER;

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
  } = useForm<ConnectionFormValues>({
    defaultValues: {
      name: "",
    },
    resolver: zodResolver(connectionSchema),
  });

  useEffect(() => {
    reset({
      name: editingConnection?.name ?? "",
    });
  }, [editingConnection, reset]);

  const submitConnection = handleSubmit(async (values) => {
    if (hasReachedConnectionsLimit) {
      showError(connectionsLimitError);
      return;
    }

    try {
      await handleSaveConnection({ editingConnection, values });
      reset();
      showSuccess(
        editingConnection
          ? "Conexão atualizada com sucesso."
          : "Conexão criada com sucesso.",
      );
      onSaved();
    } catch (saveError) {
      showError(
        getBusinessRuleErrorMessage(
          saveError,
          "Não foi possível salvar a conexão.",
        ),
      );
    }
  });

  return {
    state: { hasReachedConnectionsLimit },
    form: { control, errors, isSubmitting },
    actions: { submitConnection },
  };
}
