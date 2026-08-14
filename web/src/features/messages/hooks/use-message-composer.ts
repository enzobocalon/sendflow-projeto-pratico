import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { useConnections } from "@/features/connections/hooks/use-connections";
import { getFeedback } from "@/utils/feedback";

import { handleSaveMessage } from "../facades/message.facade";
import type { Message } from "../models/message.model";
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
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const { connections, isLoading: isLoadingConnections } = useConnections();
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
    setFormError("");

    try {
      const { isScheduled } = await handleSaveMessage({
        editingMessage,
        values,
      });

      reset();
      setSuccess(
        editingMessage
          ? "Mensagem atualizada com sucesso."
          : isScheduled
            ? "Mensagem agendada com sucesso."
            : "Mensagem enviada com sucesso.",
      );
      onSaved();
    } catch {
      setFormError("Não foi possível salvar a mensagem.");
    }
  });

  const clearSchedule = () => {
    setValue("scheduledDate", "");
    setValue("scheduledTime", "");
  };

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
    state: {
      connections,
      feedback: getFeedback(success, formError),
      isLoadingConnections,
      selectedContactsCount: selectedContactIds.length,
      selectedConnectionId,
      sendMode,
    },
    form: { control, errors, isSubmitting },
    actions: {
      cancelScheduledMode,
      clearFeedback,
      clearSelectedContacts,
      enableScheduledMode,
      submitNow,
      submitScheduled,
    },
  };
}
