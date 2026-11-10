import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Button } from "@heroui/react";
import { ApiError, GENERIC_ERROR } from "../api/http.ts";
import { submitRegistration, type SubmitResult } from "../api/submit.ts";
import { applyValueChange } from "../engine/cleanup.ts";
import { isFieldVisible } from "../engine/conditions.ts";
import { registrationConfig } from "../engine/config.ts";
import { normalizeIranMobile } from "../engine/digits.ts";
import { buildRegistrationPayload } from "../engine/payload.ts";
import type { FieldErrors, FormValues, StepConfig } from "../engine/types.ts";
import { validateStep } from "../engine/validation.ts";
import { CompletionScreen } from "./CompletionScreen.tsx";
import { FieldRenderer } from "./FieldRenderer.tsx";
import { OtpBottomSheet } from "./OtpBottomSheet.tsx";
import { ProgressBar } from "./ProgressBar.tsx";
import { ReviewSummary } from "./ReviewSummary.tsx";

const steps = registrationConfig.steps;
const CONTACT_STEP = 0;
const REVIEW_STEP = steps.length - 1;
/** Product spec overrides the config label for the step before review. */
const PRIMARY_LABEL_OVERRIDE: Record<string, string> = { service_preferences: "مرور اطلاعات" };

export function RegistrationWizard() {
  const [index, setIndex] = useState(0);
  const [values, setValues] = useState<FormValues>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  const [verifiedMobile, setVerifiedMobile] = useState<string | null>(null);
  const [otpOpen, setOtpOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [returnToReview, setReturnToReview] = useState(false);
  const [motion, setMotion] = useState<"none" | "forward" | "back">("none");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);

  const step: StepConfig = steps[index];
  const currentMobile = normalizeIranMobile(values["contact.mobile"]);
  const mobileVerified = !!currentMobile && currentMobile === verifiedMobile;

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [index, result]);

  const onChange = useCallback((id: string, value: unknown) => {
    setValues((prev) => applyValueChange(prev, id, value));
    setErrors((prev) => {
      if (!(id in prev)) return prev;
      const { [id]: _removed, ...rest } = prev;
      return rest;
    });
    setSubmitError(null);
  }, []);

  const labels = useMemo(() => steps.map((s) => s.progressLabel), []);
  const stepIds = useMemo(() => steps.map((s) => s.id), []);

  const goTo = (i: number) => {
    const next = Math.max(0, Math.min(steps.length - 1, i));
    setMotion(next === index ? "none" : next > index ? "forward" : "back");
    setIndex(next);
    setErrors({});
    setSubmitError(null);
  };

  const advance = () => {
    if (returnToReview) {
      setReturnToReview(false);
      goTo(REVIEW_STEP);
    } else {
      goTo(index + 1);
    }
  };

  const onPrimary = () => {
    if (step.primaryAction.action === "submitApplication") {
      void onSubmit();
      return;
    }
    // Contact step: verification is checked separately so the OTP sheet can open.
    const errs = validateStep(step, values, { mobileVerified: index === CONTACT_STEP ? true : mobileVerified });
    if (Object.keys(errs).length) {
      setErrors(errs);
      focusFirstError(errs);
      return;
    }
    if (index === CONTACT_STEP && !mobileVerified) {
      setOtpOpen(true);
      return;
    }
    advance();
  };

  const onSubmit = async () => {
    // Re-validate everything; send the user back to the first broken step.
    for (let i = 0; i < steps.length; i++) {
      const errs = validateStep(steps[i], values, { mobileVerified });
      if (Object.keys(errs).length) {
        goTo(i);
        setErrors(errs);
        if (i !== REVIEW_STEP) setReturnToReview(true);
        focusFirstError(errs);
        return;
      }
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = buildRegistrationPayload(values, { mobileVerified });
      const res = await submitRegistration(payload);
      setResult(res);
    } catch (e) {
      if (e instanceof ApiError) {
        const serverErrors = (e.data as { errors?: Record<string, string> } | null)?.errors;
        if (serverErrors && typeof serverErrors === "object") {
          const target = steps.findIndex((s) => s.fields.some((f) => f.id in serverErrors));
          if (target >= 0) {
            goTo(target);
            setErrors(serverErrors);
            if (target !== REVIEW_STEP) setReturnToReview(true);
          }
        }
        setSubmitError(e.message);
      } else {
        setSubmitError(GENERIC_ERROR);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onVerified = (e164: string) => {
    setVerifiedMobile(e164);
    setOtpOpen(false);
    advance();
  };

  const onBack = () => {
    setReturnToReview(false);
    const prev = step.backAction?.previousStep;
    const i = prev ? steps.findIndex((s) => s.id === prev) : index - 1;
    goTo(i >= 0 ? i : index - 1);
  };

  const onEdit = (stepId: string) => {
    const i = steps.findIndex((s) => s.id === stepId);
    if (i >= 0) {
      setReturnToReview(true);
      goTo(i);
    }
  };

  if (result) {
    return (
      <CompletionScreen
        panelStatus={result.panelStatus}
        applicationStatus={result.applicationStatus}
        applicationId={result.applicationId}
        serverMessage={result.message}
      />
    );
  }

  const isReview = index === REVIEW_STEP;
  const primaryLabel = isReview
    ? step.primaryAction.label
    : returnToReview && index !== CONTACT_STEP
      ? "بازگشت به مرور"
      : (PRIMARY_LABEL_OVERRIDE[step.id] ?? step.primaryAction.label);

  return (
    <div className="reg-wizard" data-motion={motion}>
      <header className="reg-header">
        <h1 className="reg-title">{registrationConfig.title}</h1>
      </header>

      <ProgressBar ids={stepIds} labels={labels} current={index} />

      <form
        key={step.id}
        className="reg-card-form"
        data-motion={motion}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          onPrimary();
        }}
      >
        <div className="reg-step-head">
          <h2 className="reg-step-title" tabIndex={-1} ref={headingRef}>
            {step.title}
          </h2>
          {step.description ? <p className="reg-step-desc">{step.description}</p> : null}
        </div>

        {isReview ? <ReviewSummary step={step} values={values} onEdit={onEdit} /> : null}

        <div className="reg-fields">
          {(() => {
            const visible = step.fields.filter((f) => isFieldVisible(f, values));
            const nodes: ReactNode[] = [];
            for (let i = 0; i < visible.length; i++) {
              const f = visible[i];
              const next = visible[i + 1];
              const isNamePair =
                f.id === "contact.firstName" && next?.id === "contact.lastName";
              if (isNamePair) {
                nodes.push(
                  <div key="contact-name-row" className="reg-fields__row">
                    <FieldRenderer
                      field={f}
                      values={values}
                      error={errors[f.id]}
                      onChange={onChange}
                      mobileVerified={mobileVerified}
                    />
                    <FieldRenderer
                      field={next}
                      values={values}
                      error={errors[next.id]}
                      onChange={onChange}
                      mobileVerified={mobileVerified}
                    />
                  </div>,
                );
                i++;
                continue;
              }
              nodes.push(
                <FieldRenderer
                  key={f.id}
                  field={f}
                  values={values}
                  error={errors[f.id]}
                  onChange={onChange}
                  mobileVerified={mobileVerified}
                />,
              );
            }
            return nodes;
          })()}
        </div>

        {submitError ? (
          <div className="reg-alert" role="alert">
            {submitError}
          </div>
        ) : null}

        <div className="reg-actions">
          <Button type="submit" variant="primary" className="reg-actions__primary" isPending={submitting} isDisabled={submitting}>
            {primaryLabel}
          </Button>
          {step.backAction ? (
            <Button type="button" variant="ghost" className="reg-actions__back" onPress={onBack} isDisabled={submitting}>
              {step.backAction.label}
            </Button>
          ) : null}
        </div>
      </form>

      <OtpBottomSheet
        open={otpOpen}
        phone={String(values["contact.mobile"] ?? "")}
        onClose={() => setOtpOpen(false)}
        onVerified={onVerified}
      />
    </div>
  );
}

function focusFirstError(errs: FieldErrors) {
  const id = Object.keys(errs)[0];
  if (!id) return;
  window.setTimeout(() => {
    const el = document.querySelector<HTMLElement>(`[data-field="${id}"]`);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
    el?.querySelector<HTMLElement>("input, textarea")?.focus({ preventScroll: true });
  }, 0);
}
