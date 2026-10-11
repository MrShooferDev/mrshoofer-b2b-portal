import { useState, type KeyboardEvent } from "react";
import NumberFlow from "@number-flow/react";
import "./NumberStepper.css";

export type NumberStepperProps = {
  /** Controlled value. */
  value?: number;
  /** Initial value when uncontrolled. Clamped to `min`/`max`, or snapped to the nearest entry of `values`. */
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  /** Fixed list of allowed values. When set, the buttons move through it and `min`/`max`/`step` are ignored. */
  values?: number[];
  onValueChange?: (value: number) => void;
  /** Locale for formatting. NumberFlow only animates Latin digits, so the numbering system is forced to "latn". */
  locale?: string;
  label?: string;
  decrementLabel?: string;
  incrementLabel?: string;
  className?: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function nearest(options: number[], value: number) {
  return options.reduce((best, option) =>
    Math.abs(option - value) < Math.abs(best - value) ? option : best,
  );
}

export function NumberStepper({
  value,
  defaultValue,
  min: minProp = Number.MIN_SAFE_INTEGER,
  max: maxProp = Number.MAX_SAFE_INTEGER,
  step = 1,
  values,
  onValueChange,
  locale = "fa-IR",
  label = "تعداد",
  decrementLabel = "کاهش تعداد",
  incrementLabel = "افزایش تعداد",
  className,
}: NumberStepperProps) {
  const options = values?.length ? [...values].sort((a, b) => a - b) : undefined;
  const min = options ? options[0] : minProp;
  const max = options ? options[options.length - 1] : maxProp;
  const normalize = (raw: number) => (options ? nearest(options, raw) : clamp(raw, min, max));

  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(() =>
    normalize(defaultValue ?? (options ? min : 0)),
  );
  const current = normalize(isControlled ? value : internalValue);

  /** Value `count` steps away from the current one (negative moves down). */
  const shift = (count: number) => {
    if (!options) return current + step * count;
    const index = clamp(options.indexOf(current) + count, 0, options.length - 1);
    return options[index];
  };

  const commit = (next: number) => {
    const normalized = normalize(next);
    if (normalized === current) return;
    if (!isControlled) setInternalValue(normalized);
    onValueChange?.(normalized);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const actions: Record<string, () => void> = {
      ArrowUp: () => commit(shift(1)),
      ArrowDown: () => commit(shift(-1)),
      PageUp: () => commit(shift(options ? 2 : 10)),
      PageDown: () => commit(shift(options ? -2 : -10)),
      Home: () => min !== Number.MIN_SAFE_INTEGER && commit(min),
      End: () => max !== Number.MAX_SAFE_INTEGER && commit(max),
    };
    const action = actions[event.key];
    if (!action) return;
    event.preventDefault();
    action();
  };

  return (
    <div className={className ? `ca-stepper ${className}` : "ca-stepper"}>
      <div className="ca-stepper__group" role="group" aria-label={label}>
        <button
          type="button"
          className="ca-stepper__button"
          tabIndex={-1}
          aria-label={decrementLabel}
          disabled={current <= min}
          onClick={() => commit(shift(-1))}
        >
          <svg className="ca-stepper__icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M1.75 8a.75.75 0 0 1 .75-.75h11a.75.75 0 0 1 0 1.5h-11A.75.75 0 0 1 1.75 8" />
          </svg>
        </button>

        <NumberFlow
          className="ca-stepper__value"
          value={current}
          locales={locale}
          format={{ useGrouping: false, numberingSystem: "latn" }}
          aria-hidden="true"
        />

        <button
          type="button"
          className="ca-stepper__button"
          tabIndex={-1}
          aria-label={incrementLabel}
          disabled={current >= max}
          onClick={() => commit(shift(1))}
        >
          <svg className="ca-stepper__icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M8 1.75a.75.75 0 0 1 .75.75v4.75h4.75a.75.75 0 0 1 0 1.5H8.75v4.75a.75.75 0 0 1-1.5 0V8.75H2.5a.75.75 0 0 1 0-1.5h4.75V2.5A.75.75 0 0 1 8 1.75" />
          </svg>
        </button>

        <input
          className="ca-stepper__input"
          type="text"
          inputMode="numeric"
          role="spinbutton"
          aria-label={label}
          aria-valuenow={current}
          aria-valuemin={min !== Number.MIN_SAFE_INTEGER ? min : undefined}
          aria-valuemax={max !== Number.MAX_SAFE_INTEGER ? max : undefined}
          aria-valuetext={current.toLocaleString(locale)}
          autoComplete="off"
          spellCheck={false}
          readOnly
          value={current}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
}

export default NumberStepper;
