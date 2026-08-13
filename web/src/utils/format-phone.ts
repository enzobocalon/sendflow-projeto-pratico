import {
  PHONE_MAX_LENGTH,
  normalizePhone,
  sanitizePhone,
} from "@sendflow/shared";
import {
  formatIncompletePhoneNumber,
  parsePhoneNumberFromString,
} from "libphonenumber-js/min";

const formatInternationalPhone = (digits: string) => {
  const internationalPhone = `+${digits}`;
  const parsedPhone = parsePhoneNumberFromString(internationalPhone);

  if (parsedPhone?.country === "BR") {
    return `+${parsedPhone.countryCallingCode} ${parsedPhone.formatNational()}`;
  }

  return formatIncompletePhoneNumber(internationalPhone);
};

export const normalizePhoneInput = (value: string) => {
  const normalizedPhone = normalizePhone(value);
  const digits = sanitizePhone(normalizedPhone).slice(0, PHONE_MAX_LENGTH);

  if (!digits) {
    return normalizedPhone.startsWith("+") ? "+" : "";
  }

  return normalizedPhone.startsWith("+") ? `+${digits}` : digits;
};

export const formatPhone = (value: string) => {
  const normalizedPhone = normalizePhone(value);
  const digits = sanitizePhone(normalizedPhone);

  if (!digits) {
    return normalizedPhone.startsWith("+") ? "+" : "";
  }

  if (normalizedPhone.startsWith("+")) {
    return formatInternationalPhone(digits);
  }

  return formatIncompletePhoneNumber(digits, "BR");
};
