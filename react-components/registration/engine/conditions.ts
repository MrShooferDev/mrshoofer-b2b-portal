import type { Condition, FieldConfig, FormValues } from "./types.ts";

export function isValueEmpty(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

/** All present keys of a condition object must hold (implicit AND). */
export function evaluateCondition(cond: Condition | undefined | null, values: FormValues): boolean {
  if (!cond) return true;
  if (cond.equals && !(values[cond.equals.field] === cond.equals.value)) return false;
  if (cond.notEquals && values[cond.notEquals.field] === cond.notEquals.value) return false;
  if (cond.isSet && isValueEmpty(values[cond.isSet.field])) return false;
  if (cond.isEmpty && !isValueEmpty(values[cond.isEmpty.field])) return false;
  if (cond.contains) {
    const v = values[cond.contains.field];
    const needle = cond.contains.value;
    const ok = Array.isArray(v) ? v.includes(needle) : typeof v === "string" ? v.includes(String(needle)) : false;
    if (!ok) return false;
  }
  if (cond.all && !cond.all.every((c) => evaluateCondition(c, values))) return false;
  if (cond.any && !cond.any.some((c) => evaluateCondition(c, values))) return false;
  return true;
}

export function isFieldVisible(field: FieldConfig, values: FormValues): boolean {
  return evaluateCondition(field.visibleWhen, values);
}

export function isFieldRequired(field: FieldConfig, values: FormValues): boolean {
  if (field.requiredWhen) return evaluateCondition(field.requiredWhen, values);
  return field.required === true;
}
