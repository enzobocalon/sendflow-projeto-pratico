import { PHONE_MAX_LENGTH, sanitizePhone } from "@sendflow/shared";

export const normalizePhoneInput = (value: string) =>
  sanitizePhone(value).slice(0, PHONE_MAX_LENGTH);

export const formatPhone = (value: string) => {
  const digits = sanitizePhone(value);

  if (digits.length !== 11) {
    return digits ? `+${digits}` : "";
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};
