import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../../../hooks/use-auth";
import { createConnection, upsertConnection } from "../models/connection.model";
import {
  getFirebaseErrorCode,
  getFirebaseErrorMessage,
} from "../../../utils/firebase-error";
import { connectionSchema } from "../schemas/connection.schema";
import type { Connection, ConnectionFormValues } from "../types";
import { MAX_CONNECTIONS_PER_USER } from "@sendflow/shared";

interface UseConnectionFormParams {
  connectionsCount: number;
  editingConnection: Connection | null;
  onSaved: () => void;
}

const connectionsLimitError = `Limite de ${MAX_CONNECTIONS_PER_USER} conexões atingido.`;

export function useConnectionForm(params: UseConnectionFormParams) {
  const { connectionsCount, editingConnection, onSaved } = params;
  const { user } = useAuth();
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

  const submitConnection = handleSubmit(async ({ name }) => {
    setSuccess("");

    if (!user) {
      setError("Faça login para cadastrar uma conexão.");
      return;
    }

    if (hasReachedConnectionsLimit) {
      setError(connectionsLimitError);
      return;
    }

    setError("");

    try {
      if (editingConnection) {
        await upsertConnection({
          connectionId: editingConnection.id,
          name,
        });
      } else {
        await createConnection({
          name,
        });
      }

      reset();
      setSuccess(
        editingConnection
          ? "Conexão atualizada com sucesso."
          : "Conexão criada com sucesso.",
      );
      onSaved();
    } catch (error) {
      if (getFirebaseErrorCode(error) === "firestore/resource-exhausted") {
        setError(connectionsLimitError);
        return;
      }

      setError(
        getFirebaseErrorMessage(error, "Não foi possível salvar a conexão."),
      );
    }
  });

  const clearFeedback = () => {
    setError("");
    setSuccess("");
  };

  return {
    clearFeedback,
    control,
    error,
    errors,
    hasReachedConnectionsLimit,
    isSubmitting,
    success,
    submitConnection,
  };
}
