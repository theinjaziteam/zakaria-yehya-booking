import {
  parsePhoneNumber,
  isValidPhoneNumber,
  type CountryCode,
} from "libphonenumber-js";

export function toE164(
  raw: string,
  country: CountryCode = "LB",
): string | null {
  try {
    if (raw.startsWith("+")) {
      if (!isValidPhoneNumber(raw)) return null;
      return parsePhoneNumber(raw).format("E.164");
    }
    const parsed = parsePhoneNumber(raw, country);
    return parsed.isValid() ? parsed.format("E.164") : null;
  } catch {
    return null;
  }
}

export function displayPhone(e164: string): string {
  try {
    return parsePhoneNumber(e164).formatInternational();
  } catch {
    return e164;
  }
}

export function lastFour(e164: string): string {
  return e164.slice(-4);
}
