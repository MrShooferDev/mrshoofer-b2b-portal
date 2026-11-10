export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/** Antiforgery token from a hidden form input or a <meta> tag. */
export function getAntiforgeryToken(): string | null {
  const input = document.querySelector<HTMLInputElement>('input[name="__RequestVerificationToken"]');
  if (input?.value) return input.value;
  const meta = document.querySelector<HTMLMetaElement>(
    'meta[name="__RequestVerificationToken"], meta[name="RequestVerificationToken"], meta[name="csrf-token"], meta[name="request-verification-token"]',
  );
  return meta?.content || null;
}

export const NETWORK_ERROR = "ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.";
export const GENERIC_ERROR = "خطایی رخ داد. لطفاً دوباره تلاش کنید.";

export async function postJson<T = Record<string, unknown>>(url: string, body: unknown): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  };
  const token = getAntiforgeryToken();
  if (token) {
    headers["RequestVerificationToken"] = token;
    headers["X-CSRF-TOKEN"] = token;
  }

  let res: Response;
  try {
    res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body), credentials: "same-origin" });
  } catch {
    throw new ApiError(NETWORK_ERROR, 0);
  }

  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const msg =
      data && typeof data === "object" && typeof (data as { message?: unknown }).message === "string"
        ? (data as { message: string }).message
        : GENERIC_ERROR;
    throw new ApiError(msg, res.status, data);
  }
  if (data === null || typeof data !== "object") {
    throw new ApiError(GENERIC_ERROR, res.status, data);
  }
  return data as T;
}
