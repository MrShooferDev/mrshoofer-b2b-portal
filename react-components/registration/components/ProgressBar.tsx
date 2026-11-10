import { toPersianDigits } from "../engine/digits.ts";
import { PhaseIcon } from "./PhaseIcon.tsx";

export type ProgressBarProps = {
  ids: string[];
  labels: string[];
  /** 0-based index of the current step. */
  current: number;
};

export function ProgressBar({ ids, labels, current }: ProgressBarProps) {
  const total = labels.length;
  const value = current + 1;
  const label = labels[current] ?? "";
  return (
    <nav className="reg-progress" aria-label="پیشرفت ثبت‌نام">
      <div className="reg-progress__meta">
        <span>
          مرحله {toPersianDigits(value)} از {toPersianDigits(total)}
        </span>
        <span className="reg-progress__current">{label}</span>
      </div>
      <ol
        className="reg-progress__steps"
        aria-valuetext={`مرحله ${toPersianDigits(value)} از ${toPersianDigits(total)}: ${label}`}
      >
        {labels.map((item, i) => {
          const state = i < current ? "is-done" : i === current ? "is-current" : "is-todo";
          return (
            <li key={item} className={`reg-progress__step ${state}`}>
              {i > 0 ? <span className="reg-progress__connector" aria-hidden="true" /> : null}
              <div className="reg-progress__node">
                <span className="reg-progress__circle" aria-current={i === current ? "step" : undefined}>
                  <PhaseIcon id={ids[i] ?? ""} />
                  <span className="reg-sr">
                    {i < current ? "تکمیل‌شده: " : i === current ? "مرحله فعلی: " : ""}
                    {item}
                  </span>
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
