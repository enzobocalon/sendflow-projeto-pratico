import { PHONE_MAX_LENGTH, sanitizePhone } from "@sendflow/shared";
import {
  formatIncompletePhoneNumber,
  parsePhoneNumberFromString,
} from "libphonenumber-js/min";

const BRAZIL_PHONE_LENGTH = 11;

const formatInternationalPhone = (digits: string) => {
  const internationalPhone = `+${digits}`;
  const parsedPhone = parsePhoneNumberFromString(internationalPhone);

  if (parsedPhone?.country === "BR") {
    return `+${parsedPhone.countryCallingCode} ${parsedPhone.formatNational()}`;
  }

  return formatIncompletePhoneNumber(internationalPhone);
};

export const normalizePhoneInput = (value: string) =>
  sanitizePhone(value).slice(0, PHONE_MAX_LENGTH);

export const formatPhone = (value: string) => {
  const digits = sanitizePhone(value);

  if (!digits) {
    return "";
  }

  if (digits.length === BRAZIL_PHONE_LENGTH) {
    return formatIncompletePhoneNumber(digits, "BR");
  }

  return formatInternationalPhone(digits);
};
