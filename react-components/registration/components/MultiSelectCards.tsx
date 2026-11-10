import { useState } from "react";
import type { OptionConfig } from "../engine/types.ts";
import { SERVICE_INFO } from "../data/service-info.ts";
import { OptionIcon } from "./OptionIcon.tsx";
import { ServiceInfoModal } from "./ServiceInfoModal.tsx";

export type MultiSelectCardsProps = {
  name: string;
  options: OptionConfig[];
  value: string[];
  onChange: (value: string[]) => void;
  labelledBy?: string;
  /** "chips" renders compact pills; "cards" renders cards with descriptions. */
  variant?: "cards" | "chips";
  maxSelections?: number;
  invalid?: boolean;
};

export function MultiSelectCards({
  name,
  options,
  value,
  onChange,
  labelledBy,
  variant = "cards",
  maxSelections,
  invalid,
}: MultiSelectCardsProps) {
  const [infoId, setInfoId] = useState<string | null>(null);
  const toggle = (v: string) => {
    const has = value.includes(v);
    onChange(has ? value.filter((x) => x !== v) : [...value, v]);
  };
  const atMax = !!maxSelections && value.length >= maxSelections;

  return (
    <div
      role="group"
      aria-labelledby={labelledBy}
      aria-invalid={invalid || undefined}
      className={variant === "chips" ? "reg-chips" : "reg-cards"}
    >
      {options.map((o) => {
        const selected = value.includes(o.value);
        const disabled = !selected && atMax && !o.value.startsWith("not_");
        return (
          <label
            key={o.value}
            className={`${variant === "chips" ? "reg-chip" : "reg-card"}${selected ? " is-selected" : ""}${disabled ? " is-disabled" : ""}`}
          >
            <input
              type="checkbox"
              className="reg-card__input"
              name={name}
              value={o.value}
              checked={selected}
              disabled={disabled}
              onChange={() => toggle(o.value)}
            />
            {variant === "cards" && o.icon ? (
              <span className="reg-card__glyph" aria-hidden="true">
                <OptionIcon name={o.icon} />
              </span>
            ) : null}
            <span className={variant === "cards" ? "reg-card__body" : undefined}>
              {variant === "cards" ? (
                <span className="reg-card__title-row">
                  <span className="reg-card__title">{o.label}</span>
                  {SERVICE_INFO[o.value] ? (
                    <button
                      type="button"
                      className="reg-card__info"
                      aria-label={`درباره ${o.label}`}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setInfoId(o.value);
                      }}
                    >
                      <InfoMark />
                    </button>
                  ) : null}
                </span>
              ) : (
                <span className="reg-chip__label">{o.label}</span>
              )}
              {variant === "cards" && o.description ? <span className="reg-card__desc">{o.description}</span> : null}
            </span>
            {variant === "cards" ? <span className="reg-card__mark reg-card__mark--check" aria-hidden="true" /> : null}
          </label>
        );
      })}
      {variant === "cards" ? (
        <ServiceInfoModal
          serviceId={infoId}
          selected={!!infoId && value.includes(infoId)}
          canSelect={!!infoId && (!atMax || value.includes(infoId) || infoId.startsWith("not_"))}
          onClose={() => setInfoId(null)}
          onSelect={() => {
            if (infoId) toggle(infoId);
          }}
        />
      ) : null}
    </div>
  );
}

function InfoMark() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <circle cx="10" cy="10" r="7.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="6.35" r="0.9" fill="currentColor" />
      <path d="M9.2 8.7h1.6V14H9.2z" fill="currentColor" />
    </svg>
  );
}
