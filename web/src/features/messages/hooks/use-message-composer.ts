import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";

import { getBusinessRuleErrorMessage } from "@/errors/business-rule.error";
import { useConnections } from "@/features/connections/hooks/use-connections";
import { useFeedback } from "@/providers/feedback/use-feedback";

import { handleSaveMessage } from "../messages.facade";
import type { Message } from "../messages.model";
import { messageSchema, type MessageFormValues } from "../messages.schema";

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
  const { showError, showSuccess } = useFeedback();
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
    try {
      const { isScheduled } = await handleSaveMessage({
        editingMessage,
        values,
      });

      reset();
      showSuccess(
        editingMessage
          ? "Mensagem atualizada com sucesso."
          : isScheduled
            ? "Mensagem agendada com sucesso."
            : "Mensagem enviada com sucesso.",
      );
      onSaved();
    } catch (saveError) {
      showError(
        getBusinessRuleErrorMessage(
          saveError,
          "Não foi possível salvar a mensagem.",
        ),
      );
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

  return {
    state: {
      connections,
      isLoadingConnections,
      selectedContactsCount: selectedContactIds.length,
      selectedConnectionId,
      sendMode,
    },
    form: { control, errors, isSubmitting },
    actions: {
      cancelScheduledMode,
      clearSelectedContacts,
      enableScheduledMode,
      submitNow,
      submitScheduled,
    },
  };
}
