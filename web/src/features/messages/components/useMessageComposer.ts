import { useForm, useWatch } from "react-hook-form";
import { useConnectionsOptions } from "../../../hooks/useConnectionsOptions";
import { zodResolver } from "@hookform/resolvers/zod";
import { messageSchema } from "../schemas/messageSchema";
import type { Message, MessageFormValues, MessageStatus } from "../types";
import { useContactsOptions } from "../../../hooks/useContactsOptions";
import { useEffect, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { createMessage, updateMessage } from "../../../services/messageService";
import { getFirebaseErrorMessage } from "../../../utils/firebaseError";

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
  const [contactSearchTerm, setContactSearchTerm] = useState("");
  const debouncedContactSearchTerm = useDebouncedValue(contactSearchTerm);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const {
    connections,
    error: connectionError,
    isLoading: isLoadingConnections,
  } = useConnectionsOptions();
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
    setValue,
    trigger,
  } = useForm<MessageFormValues>({
    defaultValues: getMessageFormValues(null),
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
  const selectedContactIds =
    useWatch({
      control,
      name: "contactIds",
    }) ?? [];

  const {
    contacts: availableContacts,
    currentPage: contactsCurrentPage,
    error: contactsError,
    goToNextPage: goToNextContactsPage,
    goToPreviousPage: goToPreviousContactsPage,
    hasNextPage: hasNextContactsPage,
    hasPreviousPage: hasPreviousContactsPage,
    isLoading: isLoadingContacts,
    isPageChanging: isChangingContactsPage,
  } = useContactsOptions({
    connectionId: selectedConnectionId,
    enabled: Boolean(selectedConnectionId),
    searchTerm: debouncedContactSearchTerm,
  });

  useEffect(() => {
    reset(getMessageFormValues(editingMessage));
  }, [editingMessage, reset]);

  const submitMessage = handleSubmit(async (values) => {
    setSuccess("");

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
      const status: MessageStatus = isScheduled ? "scheduled" : "sent";
      const messageData = {
        connectionId: values.connectionId,
        contactIds: values.contactIds,
        content: values.content,
        scheduledAt,
        status,
      };

      if (editingMessage) {
        await updateMessage({
          ...messageData,
          messageId: editingMessage.id,
        });
      } else {
        await createMessage(messageData);
      }

      reset();
      setSuccess(
        editingMessage
          ? "Mensagem atualizada com sucesso."
          : isScheduled
            ? "Mensagem agendada com sucesso."
            : "Mensagem enviada com sucesso.",
      );
      onSaved();
    } catch (error) {
      setFormError(
        getFirebaseErrorMessage(error, "Não foi possível salvar a mensagem."),
      );
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
    setContactSearchTerm("");
  };

  const enableScheduledMode = () => {
    setValue("sendMode", "scheduled", { shouldValidate: false });
  };

  const cancelScheduledMode = () => {
    setValue("sendMode", "now", { shouldValidate: false });
    clearSchedule();
  };

  const clearFeedback = () => {
    setFormError("");
    setSuccess("");
  };

  return {
    availableContacts,
    clearFeedback,
    clearSelectedContacts,
    contactSearchTerm,
    contactsCurrentPage,
    contactsError,
    connections,
    connectionError,
    goToNextContactsPage,
    goToPreviousContactsPage,
    hasNextContactsPage,
    hasPreviousContactsPage,
    isLoadingConnections,
    isLoadingContacts,
    isChangingContactsPage,
    control,
    errors,
    isSubmitting,
    formError,
    selectedContactsCount: selectedContactIds.length,
    selectedConnectionId,
    sendMode,
    success,
    cancelScheduledMode,
    enableScheduledMode,
    setContactSearchTerm,
    submitScheduled,
    submitNow,
  };
}
