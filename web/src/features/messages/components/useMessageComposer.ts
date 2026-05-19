import { useForm, useWatch } from "react-hook-form";
import { useConnectionsOptions } from "../../../hooks/useConnectionsOptions";
import { zodResolver } from "@hookform/resolvers/zod";
import { messageSchema } from "../schemas/messageSchema";
import type { Message, MessageFormValues } from "../types";
import { useContactsOptions } from "../../../hooks/useContactsOptions";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { createMessage, updateMessage } from "../../../services/messageService";

type UseMessageComposerParams = {
  editingMessage: Message | null;
  onSaved: () => void;
};

const formatDateInputValue = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

const formatTimeInputValue = (date: Date) =>
  [
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
  ].join(":");

const getMessageFormValues = (message: Message | null): MessageFormValues => {
  const scheduledDate = message?.scheduledAt?.toDate();

  return {
    connectionId: message?.connectionId ?? "",
    contactIds: message?.contactIds ?? [],
    content: message?.content ?? "",
    scheduledDate: scheduledDate ? formatDateInputValue(scheduledDate) : "",
    scheduledTime: scheduledDate ? formatTimeInputValue(scheduledDate) : "",
    sendMode: message?.status === "scheduled" ? "scheduled" : "now",
  };
};

export function useMessageComposer({
  editingMessage,
  onSaved,
}: UseMessageComposerParams) {
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
    reset(getMessageFormValues(editingMessage));
  }, [editingMessage, reset]);

  const availableContacts = useMemo(() => {
    if (!selectedConnectionId) {
      return [];
    }

    return contacts.filter(
      (contact) => contact.connectionId === selectedConnectionId,
    );
  }, [contacts, selectedConnectionId]);

  const submitMessage = handleSubmit(async (values) => {
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

      if (editingMessage) {
        await updateMessage({
          connectionId: values.connectionId,
          contactIds: values.contactIds,
          content: values.content,
          messageId: editingMessage.id,
          scheduledAt,
          status: isScheduled ? "scheduled" : "sent",
        });
      } else {
        await createMessage({
          connectionId: values.connectionId,
          contactIds: values.contactIds,
          content: values.content,
          scheduledAt,
          status: isScheduled ? "scheduled" : "sent",
          userId: user.uid,
        });
      }

      reset();
      onSaved();
    } catch {
      setFormError("Não foi possível salvar a mensagem.");
    }
  });

  const submitNow = () => {
    setValue("sendMode", "now");
    clearSchedule();
    submitMessage();
  };

  const submitScheduled = async () => {
    setValue("sendMode", "scheduled");
    const isValidScheduleData = await trigger([
      "scheduledDate",
      "scheduledTime",
    ]);

    if (!isValidScheduleData) {
      return;
    }
    await submitMessage();
  };

  const clearSchedule = () => {
    setValue("scheduledDate", "");
    setValue("scheduledTime", "");
  };

  const clearSelectedContacts = () => {
    setValue("contactIds", []);
  };

  const enableScheduledMode = () => {
    setValue("sendMode", "scheduled", { shouldValidate: false });
  };

  const cancelScheduledMode = () => {
    setValue("sendMode", "now", { shouldValidate: false });
    clearSchedule();
  };

  return {
    availableContacts,
    clearSelectedContacts,
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
    reset,
    submitScheduled,
    submitNow
  };
}
