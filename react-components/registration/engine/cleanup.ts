import { registrationConfig, allFields } from "./config.ts";
import { isFieldVisible, isValueEmpty } from "./conditions.ts";
import { resolveOptions } from "./labels.ts";
import type { FieldConfig, FormValues, RegistrationConfig } from "./types.ts";

/** Enforces mutually-exclusive options (e.g. not_sure) for a multi-select. */
export function applyExclusiveSelection(
  field: FieldConfig,
  prev: unknown,
  next: unknown,
): string[] {
  const nextArr = Array.isArray(next) ? (next as string[]) : [];
  const exclusive = field.mutuallyExclusiveValues ?? [];
  if (!exclusive.length) return nextArr;
  const prevArr = Array.isArray(prev) ? (prev as string[]) : [];
  const added = nextArr.filter((v) => !prevArr.includes(v));
  const addedExclusive = added.find((v) => exclusive.includes(v));
  if (addedExclusive) return [addedExclusive];
  if (nextArr.some((v) => !exclusive.includes(v))) return nextArr.filter((v) => !exclusive.includes(v));
  return nextArr;
}

/**
 * Normalizes a full values object:
 *  - drops activityAreas not valid for the current business type
 *  - clears values of hidden fields (repeated until stable)
 *  - copies business.displayName into identity.legalName when empty
 */
export function cleanupValues(
  values: FormValues,
  config: RegistrationConfig = registrationConfig,
  /** Field the user is currently editing; never auto-filled so it can be cleared. */
  editingFieldId?: string,
): FormValues {
  const fields = allFields(config);
  let out: FormValues = { ...values };

  for (let pass = 0; pass < 6; pass++) {
    let changed = false;

    for (const f of fields) {
      if (f.type === "info") continue;

      if (!isFieldVisible(f, out)) {
        // Organization panel implies business.type even though that question is hidden.
        if (f.id === "business.type" && out["access.panel"] === "organization") {
          if (out["business.type"] !== "organization") {
            out = { ...out, "business.type": "organization" };
            changed = true;
          }
          continue;
        }
        if (f.id in out) {
          const { [f.id]: _drop, ...rest } = out;
          out = rest;
          changed = true;
        }
        continue;
      }

      if (f.id === "business.type" && out["access.panel"] === "agency" && out["business.type"] === "organization") {
        const { ["business.type"]: _org, ...rest } = out;
        out = rest;
        changed = true;
        continue;
      }

      // options-dependent multi-selects: keep only still-valid values
      if (f.optionsByBusinessType && Array.isArray(out[f.id])) {
        const valid = new Set(resolveOptions(f, out).map((o) => o.value));
        const cur = out[f.id] as string[];
        const filtered = cur.filter((v) => valid.has(v));
        if (filtered.length !== cur.length) {
          out = { ...out, [f.id]: filtered };
          changed = true;
        }
      }

      // copyValue onlyIfEmpty
      if (f.defaultValueFrom && f.id !== editingFieldId && isValueEmpty(out[f.id]) && !isValueEmpty(out[f.defaultValueFrom])) {
        out = { ...out, [f.id]: out[f.defaultValueFrom] };
        changed = true;
      }
    }

    if (!changed) break;
  }
  return out;
}

/** Sets a single field value, applying exclusivity rules and cleanup. */
export function applyValueChange(
  values: FormValues,
  fieldId: string,
  value: unknown,
  config: RegistrationConfig = registrationConfig,
): FormValues {
  const field = allFields(config).find((f) => f.id === fieldId);
  let next = value;
  if (field?.mutuallyExclusiveValues?.length) {
    next = applyExclusiveSelection(field, values[fieldId], value);
  }
  return cleanupValues({ ...values, [fieldId]: next }, config, fieldId);
}
