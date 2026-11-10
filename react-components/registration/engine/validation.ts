import { isFieldRequired, isFieldVisible, isValueEmpty } from "./conditions.ts";
import { isValidIranMobile, isValidIranNationalCode, normalizeNationalCode, toEnglishDigits } from "./digits.ts";
import { resolveOptions } from "./labels.ts";
import type { FieldConfig, FieldErrors, FormValues, StepConfig } from "./types.ts";

export type ValidateOptions = { mobileVerified: boolean };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const MSG = {
  required: "این فیلد الزامی است.",
  select: "یک گزینه را انتخاب کنید.",
  minLength: (n: number) => `حداقل ${n} نویسه وارد کنید.`,
  maxLength: (n: number) => `حداکثر ${n} نویسه مجاز است.`,
  mobile: "شماره موبایل معتبر نیست.",
  mobileNotVerified: "شماره موبایل هنوز تأیید نشده است.",
  email: "ایمیل معتبر نیست.",
  nationalCode: "کد ملی معتبر نیست.",
  digitsOnly: "فقط عدد وارد کنید.",
  minSelections: (n: number) => `حداقل ${n} گزینه را انتخاب کنید.`,
  maxSelections: (n: number) => `حداکثر ${n} گزینه مجاز است.`,
  consent: "برای ادامه باید این مورد را بپذیرید.",
  invalidOption: "گزینه انتخاب‌شده معتبر نیست.",
} as const;

function validateField(field: FieldConfig, values: FormValues, opts: ValidateOptions): string | null {
  const raw = values[field.id];
  const required = isFieldRequired(field, values);
  const v = field.validation ?? {};

  if (field.type === "checkbox") {
    if (required && raw !== true) return MSG.consent;
    return null;
  }

  if (field.type === "multiSelectCards" || field.type === "multiSelectChips") {
    const arr = Array.isArray(raw) ? (raw as string[]) : [];
    const min = field.minSelections ?? (required ? 1 : 0);
    if (arr.length === 0) return required ? MSG.minSelections(Math.max(1, min)) : null;
    if (arr.length < min) return MSG.minSelections(min);
    if (field.maxSelections && arr.length > field.maxSelections) return MSG.maxSelections(field.maxSelections);
    const valid = new Set(resolveOptions(field, values).map((o) => o.value));
    if (valid.size && arr.some((x) => !valid.has(x))) return MSG.invalidOption;
    return null;
  }

  const str = typeof raw === "string" ? raw : raw == null ? "" : String(raw);
  const trimmed = str.trim();

  if (field.type === "phone") {
    if (!trimmed) return required ? MSG.required : null;
    if (!isValidIranMobile(trimmed)) return MSG.mobile;
    if (field.verification?.mustBeVerifiedToContinue && !opts.mobileVerified) return MSG.mobileNotVerified;
    return null;
  }

  if (isValueEmpty(raw)) {
    if (!required) return null;
    return field.type.startsWith("radio") || field.type.startsWith("select") ? MSG.select : MSG.required;
  }

  switch (field.type) {
    case "nationalId": {
      const code = normalizeNationalCode(trimmed);
      if (code.length !== (v.length ?? 10) || !isValidIranNationalCode(code)) return MSG.nationalCode;
      return null;
    }
    case "email":
      if (!EMAIL_RE.test(trimmed)) return MSG.email;
      if (v.maxLength && trimmed.length > v.maxLength) return MSG.maxLength(v.maxLength);
      return null;
    case "radioCards":
    case "radioCardsOrDropdown":
    case "selectCardsOrDropdown": {
      const valid = resolveOptions(field, values);
      if (valid.length && !valid.some((o) => o.value === raw)) return MSG.invalidOption;
      return null;
    }
    default:
      break;
  }

  if (v.digitsOnlyIfEntered && !/^\d+$/.test(toEnglishDigits(trimmed))) return MSG.digitsOnly;
  if (v.minLength && trimmed.length < v.minLength) return MSG.minLength(v.minLength);
  if (v.maxLength && trimmed.length > v.maxLength) return MSG.maxLength(v.maxLength);
  return null;
}

/** Validates only visible fields of a step. Returns a map of fieldId → Persian message. */
export function validateStep(step: StepConfig, values: FormValues, opts: ValidateOptions): FieldErrors {
  const errors: FieldErrors = {};
  for (const field of step.fields) {
    if (field.type === "info" || !isFieldVisible(field, values)) continue;
    const err = validateField(field, values, opts);
    if (err) errors[field.id] = err;
  }
  return errors;
}

export function validateSteps(steps: StepConfig[], values: FormValues, opts: ValidateOptions): Record<string, FieldErrors> {
  const out: Record<string, FieldErrors> = {};
  for (const s of steps) {
    const e = validateStep(s, values, opts);
    if (Object.keys(e).length) out[s.id] = e;
  }
  return out;
}

