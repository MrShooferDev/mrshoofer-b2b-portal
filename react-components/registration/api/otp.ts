import { ApiError, GENERIC_ERROR, postJson } from "./http.ts";

type OtpResponse = { success?: boolean; verified?: boolean; message?: string; retryAfterSeconds?: number };

export type SendOtpResult = { retryAfterSeconds?: number };

/** Requests an SMS code. Throws ApiError on any failure — never fakes success. */
export async function sendOtp(mobileE164: string): Promise<SendOtpResult> {
  const data = await postJson<OtpResponse>("/CreateAccount/SendOtp", { mobile: mobileE164, mobileE164 });
  if (data.success !== true) throw new ApiError(data.message || GENERIC_ERROR, 200, data);
  return { retryAfterSeconds: typeof data.retryAfterSeconds === "number" ? data.retryAfterSeconds : undefined };
}

/** Verifies the code. Resolves only when the server explicitly confirms verification. */
export async function verifyOtp(mobileE164: string, code: string): Promise<void> {
  const data = await postJson<OtpResponse>("/CreateAccount/VerifyOtp", { mobile: mobileE164, mobileE164, code });
  if (data.success !== true && data.verified !== true) {
    throw new ApiError(data.message || "کد واردشده نادرست است.", 200, data);
  }
  if (data.verified === false) throw new ApiError(data.message || "کد واردشده نادرست است.", 200, data);
}
