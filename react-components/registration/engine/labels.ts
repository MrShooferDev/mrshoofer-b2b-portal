import { BUSINESS_TYPE_FIELD, type FieldConfig, type FormValues, type OptionConfig } from "./types.ts";

function businessType(values: FormValues): string | undefined {
  const v = values[BUSINESS_TYPE_FIELD];
  return typeof v === "string" && v ? v : undefined;
}

export function resolveLabel(field: FieldConfig, values: FormValues): string {
  const bt = businessType(values);
  return (bt && field.labelByBusinessType?.[bt]) || field.label || "";
}

export function resolvePlaceholder(field: FieldConfig, values: FormValues): string {
  const bt = businessType(values);
  return (bt && field.placeholderByBusinessType?.[bt]) || field.placeholder || "";
}

export function resolveOptions(field: FieldConfig, values: FormValues): OptionConfig[] {
  if (field.optionsByBusinessType) {
    const bt = businessType(values);
    const mapped = bt ? field.optionsByBusinessType[bt] : undefined;
    if (mapped) return mapped;
    if (values["access.panel"] === "agency" && field.optionsByBusinessType.agency) {
      return field.optionsByBusinessType.agency;
    }
    return field.options ?? [];
  }
  return field.options ?? [];
}

export function optionLabel(field: FieldConfig, values: FormValues, value: unknown): string {
  const opt = resolveOptions(field, values).find((o) => o.value === value);
  return opt ? opt.label : String(value ?? "");
}
