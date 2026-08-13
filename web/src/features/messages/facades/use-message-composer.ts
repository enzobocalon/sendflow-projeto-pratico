import { zodResolver } from "@hookform/resolvers/zod";
import type { MessageStatus } from "@sendflow/shared";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { useConnections } from "@/features/connections/models/use-connections";
import { useAuth } from "@/hooks/use-auth";
import { getFirebaseErrorMessage } from "@/utils/firebase-error";

import {
  createMessage,
  upsertMessage,
  type Message,
} from "../models/message.model";
import {
  messageSchema,
  type MessageFormValues,
} from "../schemas/message.schema";

interface UseMessageComposerParams {
  editingMessage: Message | null;
  onSaved: () => void;
}

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

export function useMessageComposer(params: UseMessageComposerParams) {
  const { editingMessage, onSaved } = params;
  const { user } = useAuth();
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const {
    connections,
    error: connectionError,
    isLoading: isLoadingConnections,
  } = useConnections();
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
        await upsertMessage({
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
    clearFeedback,
    clearSelectedContacts,
    connections,
    connectionError,
    isLoadingConnections,
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
    submitScheduled,
    submitNow,
  };
}
