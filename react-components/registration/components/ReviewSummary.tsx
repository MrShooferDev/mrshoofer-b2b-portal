import { isFieldVisible, isValueEmpty } from "../engine/conditions.ts";
import { fieldMap } from "../engine/config.ts";
import { toLocalMobile, toPersianDigits } from "../engine/digits.ts";
import { resolveLabel, resolveOptions } from "../engine/labels.ts";
import type { FieldConfig, FormValues, StepConfig } from "../engine/types.ts";

/** Short labels for fields whose form label is a long question. */
const SUMMARY_LABELS: Record<string, string> = {
  "preferences.services": "خدمات موردنیاز",
  "access.panel": "نوع پنل",
  "business.type": "نوع فعالیت",
  "business.hasWebsite": "وب‌سایت",
  "business.websiteOrSocial": "آدرس وب‌سایت",
  "identity.legalForm": "نوع ثبت‌نام",
  "identity.activityAreas": "حوزه فعالیت",
  "identity.contactRole": "سمت شما",
  "attribution.source": "نحوه آشنایی",
};

export type ReviewSummaryProps = {
  step: StepConfig;
  values: FormValues;
  onEdit: (stepId: string) => void;
};

function displayValue(field: FieldConfig, values: FormValues): string {
  const raw = values[field.id];
  if (field.type === "phone") return toPersianDigits(toLocalMobile(raw));
  if (field.type === "nationalId") return toPersianDigits(raw);
  if (Array.isArray(raw)) {
    return raw
      .map((v) => resolveOptions(field, values).find((o) => o.value === v)?.label ?? String(v))
      .join("، ");
  }
  const opts = resolveOptions(field, values);
  if (opts.length) return opts.find((o) => o.value === raw)?.label ?? String(raw);
  return String(raw);
}

export function ReviewSummary({ step, values, onEdit }: ReviewSummaryProps) {
  const fields = fieldMap();
  const sections = step.summary?.sections ?? [];

  return (
    <div className="reg-summary">
      {sections.map((section) => {
        const rows = section.fields
          .map((id) => fields[id])
          .filter((f): f is FieldConfig => !!f && f.type !== "info" && isFieldVisible(f, values) && !isValueEmpty(values[f.id]));
        if (!rows.length) return null;
        return (
          <section key={section.id} className="reg-summary__section" aria-labelledby={`sum-${section.id}`}>
            <header className="reg-summary__head">
              <h3 id={`sum-${section.id}`}>{section.title}</h3>
              <button type="button" className="reg-summary__edit" onClick={() => onEdit(section.editStep)}>
                <svg className="reg-summary__edit-icon" viewBox="0 0 16 16" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M13.49 2.51a1.75 1.75 0 0 0-2.475 0L3.22 10.305a.75.75 0 0 0-.188.32l-.8 2.8a.75.75 0 0 0 .943.943l2.8-.8a.75.75 0 0 0 .32-.188l7.795-7.795a1.75 1.75 0 0 0 0-2.475zM11.545 3.04a.25.25 0 0 1 .354 0l.06.06a.25.25 0 0 1 0 .354L5.06 10.353l-.53-.53zM4.22 10.89l.89.89-1.51.432z"
                  />
                </svg>
                ویرایش
                <span className="reg-sr"> {section.title}</span>
              </button>
            </header>
            <dl className="reg-summary__list">
              {rows.map((f) => (
                <div key={f.id} className="reg-summary__row">
                  <dt>{SUMMARY_LABELS[f.id] ?? resolveLabel(f, values)}</dt>
                  <dd dir={f.type === "phone" || f.type === "email" || f.type === "urlOrText" ? "auto" : undefined}>
                    {displayValue(f, values)}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        );
      })}
    </div>
  );
}
