import type { ReactNode } from "react";
import { Description, FieldError, Input, Label, TextArea, TextField } from "@heroui/react";
import { isFieldRequired } from "../engine/conditions.ts";
import { toEnglishDigits } from "../engine/digits.ts";
import { resolveLabel, resolveOptions, resolvePlaceholder } from "../engine/labels.ts";
import type { FieldConfig, FormValues } from "../engine/types.ts";
import { CityAutocomplete } from "./CityAutocomplete.tsx";
import { MultiSelectCards } from "./MultiSelectCards.tsx";
import { RadioCards } from "./RadioCards.tsx";

export const CONSENT_LINKS: Record<string, { href: string; phrase: string }> = {
  terms_of_service: { href: "/Home/Privacy", phrase: "شرایط استفاده از خدمات" },
  privacy_notice: { href: "/Home/Privacy", phrase: "اطلاعیه حریم خصوصی" },
};

export type FieldRendererProps = {
  field: FieldConfig;
  values: FormValues;
  error?: string;
  onChange: (id: string, value: unknown) => void;
  mobileVerified?: boolean;
};

const DIGIT_TYPES = new Set(["phone", "nationalId"]);

const OPTIONAL_MARK = "(اختیاری)";

function Req({ show }: { show: boolean }) {
  return show ? (
    <span className="reg-req" aria-hidden="true">
      {" "}
      *
    </span>
  ) : null;
}

function Optional({ show }: { show: boolean }) {
  return show ? <span className="reg-optional"> {OPTIONAL_MARK}</span> : null;
}

/** Drop helpers that only repeat the optional mark; keep useful guidance. */
function helperTextFor(raw: string | undefined, required: boolean): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (/^اختیاری[.،؛]?$/.test(trimmed)) return undefined;
  if (/^پاسخ به این سؤال اختیاری است[.،؛]?$/.test(trimmed)) return undefined;
  if (!required) {
    const stripped = trimmed.replace(/^اختیاری[؛:,]\s*/, "").trim();
    return stripped || undefined;
  }
  return trimmed;
}

function GroupShell(props: {
  id: string;
  label: string;
  required: boolean;
  helper?: string;
  error?: string;
  labelId: string;
  helpId: string;
  errId: string;
  children: ReactNode;
}) {
  const helper = helperTextFor(props.helper, props.required);
  return (
    <div className="reg-field" data-field={props.id}>
      <div className="reg-label" id={props.labelId}>
        {props.label}
        <Req show={props.required} />
        <Optional show={!props.required} />
      </div>
      {helper ? (
        <p className="reg-help" id={props.helpId}>
          {helper}
        </p>
      ) : null}
      {props.children}
      {props.error ? (
        <p className="reg-error" id={props.errId} role="alert">
          {props.error}
        </p>
      ) : null}
    </div>
  );
}

function renderConsentLabel(field: FieldConfig, label: string): ReactNode {
  const link = field.linkKey ? CONSENT_LINKS[field.linkKey] : undefined;
  if (!link) return label;
  const idx = label.indexOf(link.phrase);
  const anchor = (
    <a className="reg-link" href={link.href} target="_blank" rel="noopener noreferrer">
      {link.phrase}
    </a>
  );
  if (idx < 0) {
    return (
      <>
        {label} ({anchor})
      </>
    );
  }
  return (
    <>
      {label.slice(0, idx)}
      {anchor}
      {label.slice(idx + link.phrase.length)}
    </>
  );
}

export function FieldRenderer({ field, values, error, onChange, mobileVerified }: FieldRendererProps) {
  const resolvedLabel = resolveLabel(field, values).replace(/\s*\(اختیاری\)\s*$/u, "").trim();
  const placeholder = resolvePlaceholder(field, values);
  const required = isFieldRequired(field, values);
  const helper = helperTextFor(field.helperText, required);
  const raw = values[field.id];
  const strValue = typeof raw === "string" ? raw : "";
  const labelId = `lbl-${field.id}`;
  const helpId = `help-${field.id}`;
  const errId = `err-${field.id}`;

  if (field.type === "info") {
    return (
      <div className="reg-info" role="note">
        {field.text}
      </div>
    );
  }

  const shell = (children: ReactNode) => (
    <GroupShell
      id={field.id}
      label={resolvedLabel}
      required={required}
      helper={field.helperText}
      error={error}
      labelId={labelId}
      helpId={helpId}
      errId={errId}
    >
      {children}
    </GroupShell>
  );

  switch (field.type) {
    case "radioCards":
    case "radioCardsOrDropdown":
    case "selectCardsOrDropdown":
      return (
        shell(
          <RadioCards
            name={field.id}
            options={resolveOptions(field, values)}
            value={strValue || undefined}
            onChange={(v) => onChange(field.id, v)}
            labelledBy={labelId}
            compact={field.type !== "radioCards"}
            stack={field.layout === "stack"}
            invalid={!!error}
          />,
        )
      );

    case "multiSelectCards":
    case "multiSelectChips": {
      const options = resolveOptions(field, values);
      return shell(
        options.length === 0 ? (
            <p className="reg-help">ابتدا نوع فعالیت را در مرحلهٔ قبل انتخاب کنید.</p>
        ) : (
            <MultiSelectCards
              name={field.id}
              options={options}
              value={Array.isArray(raw) ? (raw as string[]) : []}
              onChange={(v) => onChange(field.id, v)}
              labelledBy={labelId}
              variant={field.type === "multiSelectChips" ? "chips" : "cards"}
              maxSelections={field.maxSelections}
              invalid={!!error}
            />
          ),
      );
    }

    case "cityAutocomplete":
      return (
        <div className="reg-field" data-field={field.id}>
          <label className="reg-label" id={labelId} htmlFor={`in-${field.id}`}>
            {resolvedLabel}
            <Req show={required} />
            <Optional show={!required} />
          </label>
          {helper ? (
            <p className="reg-help" id={helpId}>
              {helper}
            </p>
          ) : null}
          <CityAutocomplete
            id={`in-${field.id}`}
            value={strValue}
            onChange={(v) => onChange(field.id, v)}
            placeholder={placeholder}
            invalid={!!error}
            labelledBy={labelId}
            describedBy={error ? errId : helper ? helpId : undefined}
          />
          {error ? (
            <p className="reg-error" id={errId} role="alert">
              {error}
            </p>
          ) : null}
        </div>
      );

    case "checkbox":
      return (
        <div className="reg-field reg-field--consent" data-field={field.id}>
          <label className={`reg-check${error ? " is-invalid" : ""}`}>
            <input
              type="checkbox"
              checked={raw === true}
              aria-invalid={!!error || undefined}
              aria-describedby={error ? errId : undefined}
              onChange={(e) => onChange(field.id, e.target.checked)}
            />
            <span>{renderConsentLabel(field, resolvedLabel)}</span>
          </label>
          {error ? (
            <p className="reg-error" id={errId} role="alert">
              {error}
            </p>
          ) : null}
        </div>
      );

    case "textarea":
      return (
        <TextField
          className="reg-field"
          data-field={field.id}
          fullWidth
          isInvalid={!!error}
          isRequired={required}
          value={strValue}
          onChange={(v) => onChange(field.id, v)}
        >
          <Label className="reg-label">
            {resolvedLabel}
            <Optional show={!required} />
          </Label>
          <TextArea
            className="reg-control"
            fullWidth
            variant="primary"
            placeholder={placeholder}
            rows={3}
            maxLength={field.validation?.maxLength}
          />
          {helper ? <Description>{helper}</Description> : null}
          <FieldError>{error}</FieldError>
        </TextField>
      );

    default: {
      // text, email, phone, urlOrText, nationalId
      const ltr = field.type === "phone" || field.type === "nationalId" || field.type === "email" || field.type === "urlOrText";
      const inputMode =
        field.type === "phone" ? "tel" : field.type === "nationalId" ? "numeric" : field.type === "email" ? "email" : undefined;
      const isDigits = DIGIT_TYPES.has(field.type) || field.validation?.digitsOnlyIfEntered;
      return (
        <TextField
          className="reg-field"
          data-field={field.id}
          fullWidth
          isInvalid={!!error}
          isRequired={required}
          type={field.type === "email" ? "email" : "text"}
          value={strValue}
          onChange={(v) => onChange(field.id, isDigits ? toEnglishDigits(v) : v)}
        >
          <Label className="reg-label">
            {resolvedLabel}
            <Optional show={!required} />
          </Label>
          <Input
            className={ltr ? "reg-control reg-ltr" : "reg-control"}
            fullWidth
            variant="primary"
            placeholder={placeholder}
            autoComplete={field.autocomplete}
            inputMode={inputMode}
            dir={ltr ? "ltr" : undefined}
            maxLength={field.type === "phone" ? 16 : field.validation?.maxLength}
          />
          {field.type === "phone" && mobileVerified ? (
            <span className="reg-verified">✓ شماره تأیید شده است</span>
          ) : helper ? (
            <Description>{helper}</Description>
          ) : null}
          <FieldError>{error}</FieldError>
        </TextField>
      );
    }
  }
}
