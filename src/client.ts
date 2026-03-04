import { MithrilError } from "./errors.js";
import type { MithrilConfig, PayOptions, PayResult } from "./types.js";

const DEFAULT_BASE_URL = "https://api.trymithril.com";

export class Mithril {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config: MithrilConfig = {}) {
    const key =
      config.apiKey ||
      (typeof process !== "undefined" ? process.env?.MITHRIL_API_KEY : undefined) ||
      "";
    if (!key) {
      throw new Error(
        "apiKey is required. Pass it directly or set the MITHRIL_API_KEY environment variable."
      );
    }
    this.apiKey = key;
    this.baseUrl = DEFAULT_BASE_URL;
  }

  /**
   * Pay for an x402-enabled resource.
   *
   * Sends the request through Mithril, which handles x402 negotiation
   * and pays with your USDC (deposit first, credit as fallback).
   *
   * @param url - The x402-enabled URL to call.
   * @param options - HTTP method, headers, and body.
   * @returns The upstream service's response plus a payment receipt.
   */
  async pay(url: string, options?: PayOptions): Promise<PayResult> {
    const payload: Record<string, unknown> = { url };

    if (options?.method && options.method !== "GET") {
      payload.method = options.method;
    }
    if (options?.headers) {
      payload.headers = options.headers;
    }
    if (options?.body) {
      const bytes = new TextEncoder().encode(options.body);
      const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join("");
      payload.body = btoa(binary);
    }

    const raw = await this.post("/v1/agent/purchase", payload);

    let response: unknown = null;
    let responseStatusCode = 0;

    if (raw.response) {
      const bodyB64: string = raw.response.body || "";
      let decoded: string;
      try {
        const binaryStr = atob(bodyB64);
        const bytes = Uint8Array.from(binaryStr, (c) => c.charCodeAt(0));
        decoded = new TextDecoder().decode(bytes);
      } catch {
        decoded = bodyB64;
      }
      try {
        response = JSON.parse(decoded);
      } catch {
        response = decoded;
      }
      responseStatusCode = raw.response.status_code || 0;
    }

    return {
      status: raw.status,
      response,
      responseStatusCode,
      payment: raw.payment
        ? {
            amount: raw.payment.amount,
            currency: raw.payment.currency,
            network: raw.payment.network,
            txHash: raw.payment.tx_hash,
            depositUsed: raw.payment.deposit_used,
            creditUsed: raw.payment.credit_used,
          }
        : {
            amount: "0",
            currency: "USDC",
            network: "",
            txHash: "",
            depositUsed: "0",
            creditUsed: "0",
          },
    };
  }

  private async post(path: string, body: unknown): Promise<any> {
    const resp = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      throw await MithrilError.fromResponse(resp);
    }
    return resp.json();
  }
}
