export interface MithrilConfig {
  /** Your Mithril agent API key. Falls back to MITHRIL_API_KEY env var. */
  apiKey?: string;
}

export interface PayOptions {
  /** HTTP method for the target URL. Defaults to GET. */
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  /** Headers to forward to the target URL. */
  headers?: Record<string, string>;
  /** Request body string for POST/PUT requests. */
  body?: string;
}

export interface PaymentReceipt {
  amount: string;
  currency: string;
  network: string;
  txHash: string;
  depositUsed: string;
  creditUsed: string;
}

export interface PayResult {
  /** Payment status. */
  status: string;
  /** The upstream service's HTTP response, decoded from base64. */
  response: unknown;
  /** HTTP status code from the upstream service. */
  responseStatusCode: number;
  /** Payment receipt with on-chain tx hash and breakdown. */
  payment: PaymentReceipt;
}

/** Raw error envelope from the Mithril API. */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}
