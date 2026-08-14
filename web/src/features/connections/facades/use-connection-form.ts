import { zodResolver } from "@hookform/resolvers/zod";
import { MAX_CONNECTIONS_PER_USER } from "@sendflow/shared";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import {
  getFirebaseErrorCode,
  getFirebaseErrorMessage,
} from "@/utils/firebase-error";
import { getFeedback } from "@/utils/feedback";

import {
  createConnection,
  upsertConnection,
  type Connection,
} from "../models/connection.model";
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

  const submitConnection = handleSubmit(async ({ name }) => {
    setSuccess("");

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
    state: {
      feedback: getFeedback(success, error),
      hasReachedConnectionsLimit,
    },
    form: { control, errors, isSubmitting },
    actions: { clearFeedback, submitConnection },
  };
}
