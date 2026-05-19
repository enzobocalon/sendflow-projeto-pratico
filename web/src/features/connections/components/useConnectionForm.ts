import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../../../hooks/useAuth";
import {
  createConnection,
  updateConnection,
} from "../../../services/connectionService";
import { connectionSchema } from "../schemas/connectionSchema";
import type { Connection, ConnectionFormValues } from "../types";

type UseConnectionFormParams = {
  editingConnection: Connection | null;
  onSaved: () => void;
};

export const useConnectionForm = ({
  editingConnection,
  onSaved,
}: UseConnectionFormParams) => {
  const { user } = useAuth();
  const [error, setError] = useState("");
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
    if (!user) {
      setError("Faça login para cadastrar uma conexão.");
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
          userId: user.uid,
        });
      }

      reset();
      onSaved();
    } catch {
      setError("Não foi possível salvar a conexão.");
    }
  });

  return {
    control,
    error,
    errors,
    isSubmitting,
    submitConnection,
  };
};
