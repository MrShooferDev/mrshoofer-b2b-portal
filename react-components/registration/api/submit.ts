import type { RegistrationPayload } from "../engine/payload.ts";
import { ApiError, GENERIC_ERROR, postJson } from "./http.ts";

export type SubmitResult = {
  success: boolean;
  applicationId?: string;
  applicationStatus?: string;
  panelStatus?: string;
  message?: string;
  errors?: Record<string, string>;
};

/** Submits the application. Throws ApiError unless the server reports success. */
export async function submitRegistration(payload: RegistrationPayload): Promise<SubmitResult> {
  const data = await postJson<SubmitResult>("/CreateAccount/Submit", payload);
  if (data.success === false) throw new ApiError(data.message || GENERIC_ERROR, 200, data);
  return data;
}
