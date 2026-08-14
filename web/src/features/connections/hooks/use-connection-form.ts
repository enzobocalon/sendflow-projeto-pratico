import { zodResolver } from "@hookform/resolvers/zod";
import { MAX_CONNECTIONS_PER_USER } from "@sendflow/shared";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { getBusinessRuleErrorMessage } from "@/errors/business-rule.error";
import { getFeedback } from "@/utils/feedback";

import { handleSaveConnection } from "../facades/connection.facade";
import type { Connection } from "../models/connection.model";
import {
  connectionSchema,
  type ConnectionFormValues,
} from "../schemas/connection.schema";

interface UseConnectionFormParams {
  connectionsCount: number;
  editingConnection: Connection | null;
  onSaved: () => void;
}

const connectionsLimitError = `Limite de ${MAX_CONNECTIONS_PER_USER} conexões atingido.`;

export function useConnectionForm(params: UseConnectionFormParams) {
  const { connectionsCount, editingConnection, onSaved } = params;
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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
    setSuccess("");

    if (hasReachedConnectionsLimit) {
      setError(connectionsLimitError);
      return;
    }

    setError("");

    try {
      await handleSaveConnection({ editingConnection, values });
      reset();
      setSuccess(
        editingConnection
          ? "Conexão atualizada com sucesso."
          : "Conexão criada com sucesso.",
      );
      onSaved();
    } catch (saveError) {
      setError(
        getBusinessRuleErrorMessage(
          saveError,
          "Não foi possível salvar a conexão.",
        ),
      );
    }
  });

  const clearFeedback = () => {
    setError("");
    setSuccess("");
  };

  return {
    state: {
      feedback: getFeedback(success, error),
      hasReachedConnectionsLimit,
    },
    form: { control, errors, isSubmitting },
    actions: { clearFeedback, submitConnection },
  };
}
