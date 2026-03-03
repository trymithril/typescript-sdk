import type { ApiErrorBody } from "./types.js";

export class MithrilError extends Error {
  /** Machine-readable error code (e.g. "insufficient_funds", "unauthorized"). */
  readonly code: string;
  /** HTTP status code from the API. */
  readonly statusCode: number;

  constructor(message: string, code: string, statusCode: number) {
    super(message);
    this.name = "MithrilError";
    this.code = code;
    this.statusCode = statusCode;
  }

  static async fromResponse(resp: Response): Promise<MithrilError> {
    let code = "unknown";
    let message = `Request failed (${resp.status})`;

    try {
      const body = (await resp.json()) as ApiErrorBody;
      if (body.error) {
        code = body.error.code || code;
        message = body.error.message || message;
      }
    } catch {
      // Response wasn't JSON — use the default message.
    }

    return new MithrilError(message, code, resp.status);
  }
}
