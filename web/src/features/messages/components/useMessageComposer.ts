import { useForm, useWatch } from "react-hook-form";
import { useConnectionsOptions } from "../../../hooks/useConnectionsOptions";
import { zodResolver } from "@hookform/resolvers/zod";
import { messageSchema } from "../schemas/messageSchema";
import type { MessageFormValues } from "../types";
import { useContactsOptions } from "../../../hooks/useContactsOptions";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { createMessage } from "../../../services/messageService";

export function useMessageComposer() {
  const { user } = useAuth();
  const [formError, setFormError] = useState("");
  const {
    connections,
    error: connectionError,
    isLoading: isLoadingConnections,
  } = useConnectionsOptions();
  const {
    contacts,
    error: contactsError,
    isLoading: isLoadingContacts,
  } = useContactsOptions();
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
    setValue,
    trigger,
  } = useForm<MessageFormValues>({
    defaultValues: {
      connectionId: "",
      contactIds: [],
      content: "",
      scheduledDate: "",
      scheduledTime: "",
      sendMode: "now",
    },
    resolver: zodResolver(messageSchema),
  });

  const selectedConnectionId = useWatch({
    control,
    name: "connectionId",
  });

  const sendMode = useWatch({
    control,
    name: "sendMode",
  });

  useEffect(() => {
    setValue("contactIds", []);
  }, [selectedConnectionId, setValue]);

  const availableContacts = useMemo(() => {
    if (!selectedConnectionId) {
      return [];
    }

    return contacts.filter(
      (contact) => contact.connectionId === selectedConnectionId,
    );
  }, [contacts, selectedConnectionId]);

  const saveMessage = async (values: MessageFormValues) => {
    if (!user) {
      setFormError("Faça login para salvar uma mensagem.");
      return;
    }

    setFormError("");

    try {
      const isScheduled = values.sendMode === "scheduled";
      const scheduledAt = isScheduled
        ? new Date(`${values.scheduledDate}T${values.scheduledTime}`)
        : undefined;

      await createMessage({
        connectionId: values.connectionId,
        contactIds: values.contactIds,
        content: values.content,
        scheduledAt,
        status: isScheduled ? "scheduled" : "sent",
        userId: user.uid,
      });

      reset();
    } catch {
      setFormError("Não foi possível salvar a mensagem.");
    }
  };

  const submitNow = () => {
    setValue("sendMode", "now", { shouldValidate: true });
    setValue("scheduledDate", "");
    setValue("scheduledTime", "");
    void handleSubmit((values) =>
      saveMessage({ ...values, sendMode: "now" }),
    )();
  };

  const enableScheduledMode = () => {
    setValue("sendMode", "scheduled", { shouldValidate: false });
  };

  const cancelScheduledMode = () => {
    setValue("sendMode", "now", { shouldValidate: false });
    setValue("scheduledDate", "");
    setValue("scheduledTime", "");
  };

  const submitScheduled = async () => {
    setValue("sendMode", "scheduled", { shouldValidate: true });

    const isValidSchedule = await trigger(["scheduledDate", "scheduledTime"]);

    if (!isValidSchedule) {
      return;
    }

    void handleSubmit((values) =>
      saveMessage({ ...values, sendMode: "scheduled" }),
    )();
  };

  return {
    availableContacts,
    contactsError,
    connections,
    connectionError,
    isLoadingConnections,
    isLoadingContacts,
    control,
    errors,
    isSubmitting,
    formError,
    selectedConnectionId,
    sendMode,
    cancelScheduledMode,
    enableScheduledMode,
    submitNow,
    submitScheduled,
    reset,
  };
}
