import { evaluateCondition } from "../engine/conditions.ts";
import { registrationConfig } from "../engine/config.ts";
import type { Condition } from "../engine/types.ts";

export type CompletionScreenProps = {
  /** Values are returned by the server; never inferred client-side. */
  panelStatus?: string;
  applicationStatus?: string;
  applicationId?: string;
  serverMessage?: string;
};

type State = { when: { equals: { field: string; value: string } }; title: string; message: string; primaryAction: string };

const FALLBACK = {
  title: "درخواست شما ثبت شد",
  message: "اطلاعات شما دریافت شد. نتیجه بررسی از طریق پیامک اطلاع‌رسانی می‌شود.",
};

export function CompletionScreen({ panelStatus, applicationStatus, applicationId, serverMessage }: CompletionScreenProps) {
  const states = (registrationConfig.completionStates ?? []) as State[];
  const facts = { panelStatus, applicationStatus };
  // Application problems take precedence over a stale panel status.
  const ordered = [
    ...states.filter((s) => s.when.equals.field === "applicationStatus"),
    ...states.filter((s) => s.when.equals.field !== "applicationStatus"),
  ];
  const match = ordered.find((s) => evaluateCondition(s.when as Condition, facts));
  const isProblem = match?.when.equals.field === "applicationStatus";

  const title = match?.title ?? FALLBACK.title;
  const message = isProblem
    ? serverMessage || "برای اطلاعات بیشتر با پشتیبانی مسترشوفر تماس بگیرید."
    : (match?.message ?? FALLBACK.message);
  const active = panelStatus === "active" && !isProblem;

  return (
    <div className={`reg-done${isProblem ? " is-problem" : ""}`} role="status">
      <div className="reg-done__icon" aria-hidden="true">
        {isProblem ? (
          "!"
        ) : (
          <svg viewBox="0 0 56 56" width="56" height="56">
            <path
              className="reg-done__check"
              d="M16 29.5 24.5 38 40.5 20"
              fill="none"
              stroke="#fff"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <h2 className="reg-done__title">{title}</h2>
      <p className="reg-done__text">{message}</p>
      {applicationId ? (
        <p className="reg-done__id">
          کد پیگیری: <bdi dir="ltr">{applicationId}</bdi>
        </p>
      ) : null}
      <a className="reg-btn reg-btn--primary" href="/">
        {active ? "ورود به پنل" : "بازگشت به صفحه اصلی"}
      </a>
    </div>
  );
}
