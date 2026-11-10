import type { OptionConfig } from "../engine/types.ts";
import { OptionIcon } from "./OptionIcon.tsx";

export type RadioCardsProps = {
  name: string;
  options: OptionConfig[];
  value: string | undefined;
  onChange: (value: string) => void;
  labelledBy?: string;
  /** compact = no description, smaller cards. */
  compact?: boolean;
  /** Full-width stack, used for the panel choice. */
  stack?: boolean;
  invalid?: boolean;
};

export function RadioCards({ name, options, value, onChange, labelledBy, compact, stack, invalid }: RadioCardsProps) {
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      aria-invalid={invalid || undefined}
      className={`reg-cards${compact ? " reg-cards--compact" : ""}${stack ? " reg-cards--stack" : ""}`}
    >
      {options.map((o) => {
        const selected = value === o.value;
        return (
          <label key={o.value} className={`reg-card${selected ? " is-selected" : ""}`}>
            <input
              type="radio"
              className="reg-card__input"
              name={name}
              value={o.value}
              checked={selected}
              onChange={() => onChange(o.value)}
            />
            {o.icon ? (
              <span className="reg-card__glyph" aria-hidden="true">
                <OptionIcon name={o.icon} />
              </span>
            ) : null}
            <span className="reg-card__body">
              <span className="reg-card__title">{o.label}</span>
              {!compact && o.description ? <span className="reg-card__desc">{o.description}</span> : null}
            </span>
            <span className="reg-card__mark reg-card__mark--radio" aria-hidden="true" />
          </label>
        );
      })}
    </div>
  );
}
