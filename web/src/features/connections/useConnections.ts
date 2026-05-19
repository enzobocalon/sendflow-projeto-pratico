import { zodResolver } from "@hookform/resolvers/zod";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../../hooks/useAuth";
import { db } from "../../lib/firebase";
import { connectionSchema } from "./schemas/connectionSchema";
import type { Connection, ConnectionFormValues } from "./types";
import { useConnectionOptions } from "../../hooks/useConnectionsOptions";

export const useConnections = () => {
  const { user } = useAuth();
  const [connectionToDelete, setConnectionToDelete] =
    useState<Connection | null>(null);
  const [editingConnection, setEditingConnection] = useState<Connection | null>(
    null,
  );
  const [formError, setFormError] = useState("");
  const [listError, setListError] = useState("");
  const { connections, isLoading } = useConnectionOptions();
  const [searchTerm, setSearchTerm] = useState("");
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

  const filteredConnections = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    if (!normalizedSearchTerm) {
      return connections;
    }

    return connections.filter((connection) =>
      connection.name.toLowerCase().includes(normalizedSearchTerm),
    );
  }, [connections, searchTerm]);

  const submitConnection = handleSubmit(async ({ name }) => {
    if (!user) {
      setFormError("Faça login para cadastrar uma conexão.");
      return;
    }

    setFormError("");

    try {
      if (editingConnection) {
        await updateDoc(doc(db, "connections", editingConnection.id), {
          name: name.trim(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "connections"), {
          createdAt: serverTimestamp(),
          name: name.trim(),
          updatedAt: serverTimestamp(),
          userId: user.uid,
        });
      }

      setEditingConnection(null);
      reset();
    } catch {
      setFormError("Não foi possível salvar a conexão.");
    }
  });

  const editConnection = (connection: Connection) => {
    setFormError("");
    setEditingConnection(connection);
  };

  const cancelEdit = () => {
    setFormError("");
    setEditingConnection(null);
    reset();
  };

  const requestDeleteConnection = (connection: Connection) => {
    setListError("");
    setConnectionToDelete(connection);
  };

  const closeDeleteModal = () => {
    setConnectionToDelete(null);
  };

  const confirmDeleteConnection = async () => {
    if (!connectionToDelete) {
      return;
    }

    setListError("");

    try {
      await deleteDoc(doc(db, "connections", connectionToDelete.id));

      if (editingConnection?.id === connectionToDelete.id) {
        cancelEdit();
      }
      closeDeleteModal();
    } catch {
      setListError("Não foi possível excluir a conexão.");
    }
  };

  return {
    cancelEdit,
    closeDeleteModal,
    confirmDeleteConnection,
    connections: filteredConnections,
    connectionToDelete,
    editConnection,
    editingConnection,
    formError,
    formErrors: errors,
    formControl: control,
    isSubmitting,
    listError,
    isLoading,
    requestDeleteConnection,
    searchTerm,
    setSearchTerm,
    submitConnection,
    totalConnections: connections.length,
  };
};
