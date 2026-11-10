const PERSIAN_ZERO = 0x06f0;
const ARABIC_ZERO = 0x0660;

/** Converts Persian (۰-۹) and Arabic-Indic (٠-٩) digits to ASCII. */
export function toEnglishDigits(input: unknown): string {
  if (input === null || input === undefined) return "";
  return String(input).replace(/[\u06f0-\u06f9\u0660-\u0669]/g, (ch) => {
    const code = ch.charCodeAt(0);
    return String(code >= PERSIAN_ZERO + 0 && code <= PERSIAN_ZERO + 9 ? code - PERSIAN_ZERO : code - ARABIC_ZERO);
  });
}

/**
 * Normalizes an Iranian mobile number to E.164 (+989XXXXXXXXX).
 * Accepts 09xx…, 9xx…, 989xx…, 0098 9xx…, +989xx… in any digit script.
 * Returns null when the input is not a valid Iranian mobile.
 */
export function normalizeIranMobile(input: unknown): string | null {
  let digits = toEnglishDigits(input).replace(/[^\d]/g, "");
  if (!digits) return null;
  if (digits.startsWith("0098")) digits = digits.slice(4);
  else if (digits.startsWith("98")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  if (!/^9\d{9}$/.test(digits)) return null;
  return `+98${digits}`;
}

export function isValidIranMobile(input: unknown): boolean {
  return normalizeIranMobile(input) !== null;
}

/** Local display form (09xxxxxxxxx) of an E.164 / any valid mobile. */
export function toLocalMobile(input: unknown): string {
  const e164 = normalizeIranMobile(input);
  return e164 ? `0${e164.slice(3)}` : toEnglishDigits(input);
}

/** ASCII digits only. */
export function normalizeNationalCode(input: unknown): string {
  return toEnglishDigits(input).replace(/[^\d]/g, "");
}

/** Iranian national code checksum validation. */
export function isValidIranNationalCode(input: unknown): boolean {
  const code = normalizeNationalCode(input);
  if (!/^\d{10}$/.test(code)) return false;
  if (/^(\d)\1{9}$/.test(code)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(code[i]) * (10 - i);
  const r = sum % 11;
  const check = Number(code[9]);
  return r < 2 ? check === r : check === 11 - r;
}

/** ASCII digits → Persian digits (for display). */
export function toPersianDigits(input: unknown): string {
  return String(input ?? "").replace(/\d/g, (d) => String.fromCharCode(PERSIAN_ZERO + Number(d)));
}
