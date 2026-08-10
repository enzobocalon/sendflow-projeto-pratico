import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../../../hooks/useAuth";
import {
  createConnection,
  updateConnection,
} from "../../../services/connectionService";
import { getFirebaseErrorMessage } from "../../../utils/firebaseError";
import { connectionSchema } from "../schemas/connectionSchema";
import type { Connection, ConnectionFormValues } from "../types";

type UseConnectionFormParams = {
  connectionsCount: number;
  editingConnection: Connection | null;
  onSaved: () => void;
};

const MAX_CONNECTIONS = 100;

export const useConnectionForm = ({
  connectionsCount,
  editingConnection,
  onSaved,
}: UseConnectionFormParams) => {
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const hasReachedConnectionsLimit =
    !editingConnection && connectionsCount >= MAX_CONNECTIONS;

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
      setError(`Limite de ${MAX_CONNECTIONS} conexões atingido.`);
      return;
    }

    setError("");

    try {
      if (editingConnection) {
        await updateConnection({
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
      if (
        error instanceof Error &&
        error.message === "connections-limit-reached"
      ) {
        setError(`Limite de ${MAX_CONNECTIONS} conexões atingido.`);
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
};
