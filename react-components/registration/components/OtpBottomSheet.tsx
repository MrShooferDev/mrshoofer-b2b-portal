import { useCallback, useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Button, Spinner } from "@heroui/react";
import { sendOtp, verifyOtp } from "../api/otp.ts";
import { ApiError, GENERIC_ERROR } from "../api/http.ts";
import { normalizeIranMobile, toEnglishDigits, toLocalMobile, toPersianDigits } from "../engine/digits.ts";

const CODE_LENGTH = 5;
const RESEND_SECONDS = 90;

export type OtpBottomSheetProps = {
  open: boolean;
  /** Mobile number in any accepted format. */
  phone: string;
  onClose: () => void;
  /** Called only after the server explicitly confirmed the code. */
  onVerified: (mobileE164: string) => void;
};

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return toPersianDigits(`${m}:${String(s).padStart(2, "0")}`);
}

export function OtpBottomSheet({ open, phone, onClose, onVerified }: OtpBottomSheetProps) {
  const [digits, setDigits] = useState<string[]>(() => Array(CODE_LENGTH).fill(""));
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const reqId = useRef(0);
  const e164 = normalizeIranMobile(phone);

  const send = useCallback(async () => {
    if (!e164) {
      setError("شماره موبایل معتبر نیست.");
      return;
    }
    const id = ++reqId.current;
    setSending(true);
    setError(null);
    setDigits(Array(CODE_LENGTH).fill(""));
    try {
      const res = await sendOtp(e164);
      if (id !== reqId.current) return;
      setSent(true);
      setRemaining(res.retryAfterSeconds ?? RESEND_SECONDS);
      inputs.current[0]?.focus();
    } catch (e) {
      if (id !== reqId.current) return;
      setSent(false);
      setError(e instanceof ApiError ? e.message : GENERIC_ERROR);
      setRemaining(0);
    } finally {
      if (id === reqId.current) setSending(false);
    }
  }, [e164]);

  // Send once each time the sheet opens.
  useEffect(() => {
    if (!open) {
      reqId.current++;
      setSent(false);
      setError(null);
      setRemaining(0);
      setSending(false);
      setVerifying(false);
      setDigits(Array(CODE_LENGTH).fill(""));
      return;
    }
    void send();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Countdown
  useEffect(() => {
    if (!open || remaining <= 0) return;
    const t = window.setTimeout(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [open, remaining]);

  // Scroll lock + Escape
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const submit = useCallback(
    async (code: string) => {
      if (!e164 || verifying) return;
      setVerifying(true);
      setError(null);
      try {
        await verifyOtp(e164, code);
        onVerified(e164);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : GENERIC_ERROR);
        setDigits(Array(CODE_LENGTH).fill(""));
        inputs.current[0]?.focus();
      } finally {
        setVerifying(false);
      }
    },
    [e164, verifying, onVerified],
  );

  const setAt = (index: number, raw: string) => {
    const clean = toEnglishDigits(raw).replace(/\D/g, "");
    if (!clean) {
      setDigits((d) => d.map((x, i) => (i === index ? "" : x)));
      return;
    }
    const next = [...digits];
    let i = index;
    for (const ch of clean.slice(0, CODE_LENGTH - index)) next[i++] = ch;
    setDigits(next);
    setError(null);
    const focusIdx = Math.min(i, CODE_LENGTH - 1);
    inputs.current[focusIdx]?.focus();
    if (next.every(Boolean)) void submit(next.join(""));
  };

  const onKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index < CODE_LENGTH - 1) {
      // RTL page, but digit boxes are laid out LTR: left = next
      inputs.current[index + 1]?.focus();
    } else if (e.key === "ArrowRight" && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = toEnglishDigits(e.clipboardData.getData("text")).replace(/\D/g, "");
    if (!text) return;
    e.preventDefault();
    setAt(0, text);
  };

  if (!open) return null;

  const busy = sending || verifying;

  return createPortal(
    <div className="reg-root reg-sheet-layer" dir="rtl">
      <div className="reg-sheet__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="reg-sheet" role="dialog" aria-modal="true" aria-labelledby="reg-otp-title">
        <div className="reg-sheet__grip" aria-hidden="true" />
        <h2 className="reg-sheet__title" id="reg-otp-title">
          تأیید شماره موبایل
        </h2>
        <p className="reg-sheet__text">
          کد ۵ رقمی ارسال‌شده به{" "}
          <bdi className="reg-sheet__phone" dir="ltr">
            {toPersianDigits(toLocalMobile(phone))}
          </bdi>{" "}
          را وارد کنید.
        </p>

        <div className="reg-otp" dir="ltr" aria-busy={busy}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputs.current[i] = el;
              }}
              className={`reg-otp__box${error ? " is-invalid" : ""}`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              maxLength={CODE_LENGTH}
              aria-label={`رقم ${toPersianDigits(i + 1)}`}
              value={d ? toPersianDigits(d) : ""}
              disabled={busy || !sent}
              onChange={(e) => setAt(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              onPaste={onPaste}
              onFocus={(e) => e.target.select()}
            />
          ))}
        </div>

        <div className="reg-sheet__status" aria-live="polite">
          {busy ? (
            <span className="reg-sheet__loading">
              <Spinner size="sm" /> {sending ? "در حال ارسال کد…" : "در حال بررسی کد…"}
            </span>
          ) : error ? (
            <p className="reg-error" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="reg-sheet__actions">
          {remaining > 0 ? (
            <span className="reg-sheet__timer">ارسال مجدد کد تا {formatTime(remaining)} دیگر</span>
          ) : (
            <Button variant="tertiary" onPress={() => void send()} isDisabled={busy}>
              {sent || error ? "ارسال مجدد کد" : "ارسال کد"}
            </Button>
          )}
          <Button variant="tertiary" size="md" onPress={onClose} isDisabled={verifying}>
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M11.146 1.646a.5.5 0 0 1 .708 0l2.5 2.5a.5.5 0 0 1 0 .708l-8.5 8.5A.5.5 0 0 1 5.5 13.5H3a.5.5 0 0 1-.5-.5v-2.5a.5.5 0 0 1 .146-.354l8.5-8.5ZM4 11.207V12.5h1.293l7.146-7.146-1.293-1.293L4 11.207Z"
                fill="currentColor"
              />
            </svg>
            ویرایش شماره
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
