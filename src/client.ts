import { MithrilError } from "./errors.js";
import type {
  Agent,
  AgentStats,
  Assets,
  BalanceSheet,
  BillingInfo,
  Card,
  CardDetails,
  CreditProfile,
  LedgerEntry,
  Liabilities,
  LoanItem,
  MithrilConfig,
  PayApiResponse,
  PayOptions,
  PayResult,
  PaymentReceipt,
  PositionItem,
  ReconcileResult,
  RepaymentAddress,
  SendResult,
  SpendingPower,
  Statement,
  Transaction,
  Wallet,
  WalletAddress,
  WalletBalance,
  WalletSpendingPower,
} from "./types.js";

const DEFAULT_BASE_URL = "https://api.trymithril.com";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function decodeResponseBody(bodyB64: string): unknown {
  let decoded: string;
  try {
    const binaryStr = atob(bodyB64);
    const bytes = Uint8Array.from(binaryStr, (c) => c.charCodeAt(0));
    decoded = new TextDecoder().decode(bytes);
  } catch {
    decoded = bodyB64;
  }
  try {
    return JSON.parse(decoded);
  } catch {
    return decoded;
  }
}

function mapPayment(raw: PayApiResponse): PaymentReceipt {
  const p = raw.payment;
  if (!p) {
    return { amount: "0", currency: "USDC", network: "", txHash: "", depositUsed: "0", creditUsed: "0" };
  }
  return {
    amount: p.amount,
    currency: p.currency,
    network: p.network,
    txHash: p.tx_hash,
    depositUsed: p.deposit_used,
    creditUsed: p.credit_used,
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function parseWalletAddress(raw: any): WalletAddress {
  return { network: raw.network ?? "", address: raw.address ?? "" };
}

function parseWallet(raw: any): Wallet {
  return {
    id: raw.id ?? "",
    label: raw.label ?? "",
    isPrimary: raw.is_primary ?? false,
    creditLimit: raw.credit_limit ?? "0",
    apr: raw.apr ?? "0",
    outstandingBalance: raw.outstanding_balance ?? "0",
    accruedInterest: raw.accrued_interest ?? "0",
    availableCredit: raw.available_credit ?? "0",
    totalOwed: raw.total_owed ?? "0",
    creditStatus: raw.credit_status ?? "",
    depositBalance: raw.deposit_balance ?? "0",
    spendingPower: raw.spending_power ?? "0",
    addresses: (raw.addresses ?? []).map(parseWalletAddress),
    isFrozen: raw.is_frozen ?? false,
    autoCollectMode: raw.auto_collect_mode ?? "",
    billingDay: raw.billing_day ?? 1,
    gracePeriodActive: raw.grace_period_active ?? false,
    missedPayments: raw.missed_payments ?? 0,
    rewardBalance: raw.reward_balance ?? "0",
    createdAt: raw.created_at ?? "",
  };
}

function parseAgent(raw: any): Agent {
  return {
    id: raw.id ?? "",
    name: raw.name ?? "",
    status: raw.status ?? "",
    wallets: (raw.wallets ?? []).map(parseWallet),
    createdAt: raw.created_at ?? "",
  };
}

function parseSpendingPower(raw: any): SpendingPower {
  return {
    depositBalance: raw.deposit_balance ?? "0",
    creditAvailable: raw.credit_available ?? "0",
    totalSpendingPower: raw.total_spending_power ?? "0",
    rewardBalance: raw.reward_balance ?? "0",
    wallets: (raw.wallets ?? []).map((w: any): WalletSpendingPower => ({
      walletId: w.wallet_id ?? "",
      label: w.label ?? "",
      isPrimary: w.is_primary ?? false,
      depositBalance: w.deposit_balance ?? "0",
      availableCredit: w.available_credit ?? "0",
      spendingPower: w.spending_power ?? "0",
      rewardBalance: w.reward_balance ?? "0",
    })),
  };
}

function parseBalanceSheet(raw: any): BalanceSheet {
  const a = raw.assets ?? {};
  const l = raw.liabilities ?? {};
  return {
    agentId: raw.agent_id ?? "",
    assets: {
      cash: (a.cash ?? []).map((c: any): WalletBalance => ({
        walletId: c.wallet_id ?? "",
        label: c.label ?? "",
        isPrimary: c.is_primary ?? false,
        network: c.network ?? "",
        address: c.address ?? "",
        balanceUsdc: c.balance_usdc ?? "0",
      })),
      totalCash: a.total_cash ?? "0",
      positions: (a.positions ?? []).map((p: any): PositionItem => ({
        tokenId: p.token_id ?? "",
        marketId: p.market_id ?? "",
        exchange: p.exchange ?? "",
        side: p.side ?? "",
        quantity: p.quantity ?? "0",
        costBasis: p.cost_basis ?? "0",
        currentPrice: p.current_price ?? undefined,
        marketValue: p.market_value ?? undefined,
      })),
      totalPositions: a.total_positions ?? "0",
      totalAssets: a.total_assets ?? "0",
    },
    liabilities: {
      loans: (l.loans ?? []).map((ln: any): LoanItem => ({
        loanId: ln.loan_id ?? "",
        status: ln.status ?? "",
        principal: ln.principal ?? "0",
        outstandingBalance: ln.outstanding_balance ?? "0",
        accruedInterest: ln.accrued_interest ?? "0",
      })),
      totalOutstanding: l.total_outstanding ?? "0",
      totalInterest: l.total_interest ?? "0",
      totalLiabilities: l.total_liabilities ?? "0",
    },
    netEquity: raw.net_equity ?? "0",
    computedAt: raw.computed_at ?? "",
  };
}

function parseCreditProfile(raw: any): CreditProfile {
  return {
    agentId: raw.agent_id ?? "",
    totalLoans: raw.total_loans ?? 0,
    activeLoans: raw.active_loans ?? 0,
    successfulLoans: raw.successful_loans ?? 0,
    defaultedLoans: raw.defaulted_loans ?? 0,
    missedPaymentsEver: raw.missed_payments_ever ?? 0,
    tier: raw.tier ?? "new",
    historyScore: raw.history_score ?? 0,
    firstLoanAt: raw.first_loan_at ?? undefined,
    lastLoanAt: raw.last_loan_at ?? undefined,
  };
}

function parseBilling(raw: any): BillingInfo {
  return {
    walletId: raw.wallet_id ?? "",
    outstandingBalance: raw.outstanding_balance ?? "0",
    accruedInterest: raw.accrued_interest ?? "0",
    totalOwed: raw.total_owed ?? "0",
    minimumPayment: raw.minimum_payment ?? "0",
    dueDate: raw.due_date ?? "",
    apr: raw.apr ?? "0",
    billingDay: raw.billing_day ?? 1,
    gracePeriodActive: raw.grace_period_active ?? false,
    repaymentAddresses: (raw.repayment_addresses ?? []).map((a: any): RepaymentAddress => ({
      network: a.network ?? "",
      address: a.address ?? "",
    })),
  };
}

function parseTransaction(raw: any): Transaction {
  return {
    id: raw.id ?? "",
    amount: raw.amount ?? "0",
    currency: raw.currency ?? "USDC",
    entryType: raw.entry_type ?? "",
    description: raw.description ?? "",
    createdAt: raw.created_at ?? "",
    network: raw.network ?? undefined,
    txHash: raw.tx_hash ?? undefined,
    merchantDomain: raw.merchant_domain ?? undefined,
    merchantEndpoint: raw.merchant_endpoint ?? undefined,
    explorerUrl: raw.explorer_url ?? undefined,
  };
}

function parseLedgerEntry(raw: any): LedgerEntry {
  return {
    id: raw.id ?? "",
    amount: raw.amount ?? "0",
    currency: raw.currency ?? "USDC",
    entryType: raw.entry_type ?? "",
    description: raw.description ?? "",
    createdAt: raw.created_at ?? "",
    debitAccount: raw.debit_account ?? undefined,
    creditAccount: raw.credit_account ?? undefined,
    referenceId: raw.reference_id ?? undefined,
    network: raw.network ?? undefined,
    txHash: raw.tx_hash ?? undefined,
  };
}

function parseCard(raw: any): Card {
  return {
    id: raw.id ?? "",
    walletId: raw.wallet_id ?? "",
    label: raw.label ?? "",
    lastFour: raw.last_four ?? "",
    status: raw.status ?? "",
    singleLimit: raw.single_limit ?? "0",
    dailyLimit: raw.daily_limit ?? "0",
    monthlyLimit: raw.monthly_limit ?? "0",
    createdAt: raw.created_at ?? "",
  };
}

function parseStatement(raw: any): Statement {
  return {
    id: raw.id ?? "",
    walletId: raw.wallet_id ?? "",
    statementPeriodStart: raw.statement_period_start ?? "",
    statementPeriodEnd: raw.statement_period_end ?? "",
    previousBalance: raw.previous_balance ?? "0",
    purchases: raw.purchases ?? "0",
    cashAdvances: raw.cash_advances ?? "0",
    fees: raw.fees ?? "0",
    interest: raw.interest ?? "0",
    payments: raw.payments ?? "0",
    finalBalance: raw.final_balance ?? "0",
    minimumDue: raw.minimum_due ?? "0",
    dueDate: raw.due_date ?? "",
    transactionCount: raw.transaction_count ?? 0,
    createdAt: raw.created_at ?? "",
  };
}

function extractList(raw: any): any[] {
  return Array.isArray(raw) ? raw : (raw?.data ?? []);
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export class Mithril {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config: MithrilConfig = {}) {
    const key =
      config.apiKey ??
      (typeof process !== "undefined" ? process.env?.MITHRIL_API_KEY : undefined) ??
      "";
    if (!key) {
      throw new Error(
        "apiKey is required. Pass it directly or set the MITHRIL_API_KEY environment variable."
      );
    }
    this.apiKey = key;
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
  }

  // -----------------------------------------------------------------------
  // HTTP helpers
  // -----------------------------------------------------------------------

  private async get<T>(path: string, params?: Record<string, string | number>): Promise<T> {
    let url = `${this.baseUrl}${path}`;
    if (params) {
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        qs.set(k, String(v));
      }
      url += `?${qs.toString()}`;
    }
    const resp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });
    if (!resp.ok) throw await MithrilError.fromResponse(resp);
    return resp.json() as Promise<T>;
  }

  private async post<T>(path: string, body?: unknown): Promise<T> {
    const resp = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: body != null ? JSON.stringify(body) : undefined,
    });
    if (!resp.ok) throw await MithrilError.fromResponse(resp);
    return resp.json() as Promise<T>;
  }

  private async put<T>(path: string, body?: unknown): Promise<T> {
    const resp = await fetch(`${this.baseUrl}${path}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: body != null ? JSON.stringify(body) : undefined,
    });
    if (!resp.ok) throw await MithrilError.fromResponse(resp);
    return resp.json() as Promise<T>;
  }

  // -----------------------------------------------------------------------
  // Identity & Balance
  // -----------------------------------------------------------------------

  /** Get your agent identity and status. */
  async getAgent(): Promise<Agent> {
    const raw = await this.get("/v1/agent");
    return parseAgent(raw);
  }

  /** Get aggregate agent statistics (orders, PnL, debt). */
  async getStats(): Promise<AgentStats> {
    const raw = await this.get<Record<string, any>>("/v1/agent/stats");
    return {
      totalOrders: raw.total_orders ?? 0,
      totalPnl: raw.total_pnl ?? "0",
      outstandingDebt: raw.outstanding_debt ?? "0",
      activeLoans: raw.active_loans ?? 0,
    };
  }

  /** Check how much USDC you can spend right now. */
  async getSpendingPower(): Promise<SpendingPower> {
    const raw = await this.get("/v1/agent/spending-power");
    return parseSpendingPower(raw);
  }

  /** Get your full financial overview. */
  async getBalanceSheet(): Promise<BalanceSheet> {
    const raw = await this.get("/v1/balance-sheet");
    return parseBalanceSheet(raw);
  }

  /** Check your credit tier and repayment history. */
  async getCreditProfile(): Promise<CreditProfile> {
    const raw = await this.get("/v1/credit-profile");
    return parseCreditProfile(raw);
  }

  // -----------------------------------------------------------------------
  // Wallets
  // -----------------------------------------------------------------------

  /** List all your wallets with balances and credit details. */
  async listWallets(): Promise<Wallet[]> {
    const raw = await this.get("/v1/wallets");
    return extractList(raw).map(parseWallet);
  }

  /** Get details for a specific wallet. */
  async getWallet(walletId: string): Promise<Wallet> {
    const raw = await this.get(`/v1/wallets/${walletId}`);
    return parseWallet(raw);
  }

  /** Set a wallet as your primary wallet. */
  async setPrimaryWallet(walletId: string): Promise<Wallet> {
    const raw = await this.put(`/v1/wallets/${walletId}/primary`);
    return parseWallet(raw);
  }

  /** Get billing info for a wallet (balance, minimum payment, due date). */
  async getBilling(walletId: string): Promise<BillingInfo> {
    const raw = await this.get(`/v1/wallets/${walletId}/billing`);
    return parseBilling(raw);
  }

  /** List credit transactions for a wallet. */
  async listTransactions(walletId: string, limit = 50): Promise<Transaction[]> {
    const raw = await this.get(`/v1/wallets/${walletId}/transactions`, { limit });
    return extractList(raw).map(parseTransaction);
  }

  /** Add a new blockchain address to a wallet. */
  async addAddress(walletId: string, network: string): Promise<Wallet> {
    const raw = await this.post(`/v1/wallets/${walletId}/addresses`, { network });
    return parseWallet(raw);
  }

  /** Detect and apply on-chain deposits to a wallet. */
  async reconcile(walletId: string): Promise<ReconcileResult> {
    const raw = await this.post<Record<string, any>>(`/v1/wallets/${walletId}/reconcile`);
    return {
      amountApplied: raw.amount_applied ?? "0",
      remainingBalance: raw.remaining_balance ?? "0",
      depositBalance: raw.deposit_balance ?? "0",
      txHash: raw.tx_hash ?? undefined,
      network: raw.network ?? undefined,
      autoCollectMode: raw.auto_collect_mode ?? "",
    };
  }

  // -----------------------------------------------------------------------
  // Credit Management
  // -----------------------------------------------------------------------

  /**
   * Repay outstanding credit balance on a wallet.
   * @param walletId - The wallet to repay.
   * @param mode - 'full', 'minimum', or 'custom'.
   * @param amount - USDC amount (required when mode is 'custom').
   */
  async repay(walletId: string, mode = "full", amount?: string): Promise<Wallet> {
    const payload: Record<string, unknown> = { mode };
    if (amount != null) payload.amount = amount;
    const raw = await this.post(`/v1/wallets/${walletId}/repay`, payload);
    return parseWallet(raw);
  }

  /**
   * Withdraw USDC from your credit line to your deposit balance.
   * WARNING: 3% fee is charged and interest accrues immediately.
   */
  async cashAdvance(walletId: string, amount: string): Promise<Wallet> {
    const raw = await this.post(`/v1/wallets/${walletId}/cash-advance`, { amount });
    return parseWallet(raw);
  }

  /**
   * Send USDC from a wallet to any on-chain address.
   * Only deposit balance can be sent — credit cannot be transferred directly.
   */
  async send(walletId: string, destination: string, amount: string, network: string): Promise<SendResult> {
    const raw = await this.post<Record<string, string>>(`/v1/wallets/${walletId}/send`, {
      destination,
      amount,
      network,
    });
    return {
      txHash: raw.tx_hash ?? "",
      amount: raw.amount ?? "0",
      network: raw.network ?? "",
      depositUsed: raw.deposit_used ?? "0",
      creditUsed: raw.credit_used ?? "0",
    };
  }

  // -----------------------------------------------------------------------
  // Payments
  // -----------------------------------------------------------------------

  /**
   * Pay for an x402-enabled resource.
   * Sends the request through Mithril, which handles x402 negotiation
   * and pays with your USDC (deposit first, credit as fallback).
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

    const raw = await this.post<PayApiResponse>("/v1/agent/pay", payload);

    let response: unknown = null;
    let responseStatusCode = 0;
    if (raw.response?.body != null) {
      response = decodeResponseBody(raw.response.body);
      responseStatusCode = raw.response.status_code ?? 0;
    }

    return {
      status: raw.status,
      response,
      responseStatusCode,
      payment: mapPayment(raw),
    };
  }

  /** Pay from a specific wallet. */
  async payFromWallet(walletId: string, url: string, options?: PayOptions): Promise<PayResult> {
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

    const raw = await this.post<PayApiResponse>(`/v1/wallets/${walletId}/pay`, payload);

    let response: unknown = null;
    let responseStatusCode = 0;
    if (raw.response?.body != null) {
      response = decodeResponseBody(raw.response.body);
      responseStatusCode = raw.response.status_code ?? 0;
    }

    return {
      status: raw.status,
      response,
      responseStatusCode,
      payment: mapPayment(raw),
    };
  }

  // -----------------------------------------------------------------------
  // Ledger
  // -----------------------------------------------------------------------

  /** List ledger entries. */
  async listLedger(entryType?: string, limit = 50): Promise<LedgerEntry[]> {
    const params: Record<string, string | number> = { limit };
    if (entryType) params.entry_type = entryType;
    const raw = await this.get("/v1/ledger", params);
    return extractList(raw).map(parseLedgerEntry);
  }

  // -----------------------------------------------------------------------
  // Cards
  // -----------------------------------------------------------------------

  /** List all your cards. */
  async listCards(): Promise<Card[]> {
    const raw = await this.get("/v1/agent/cards");
    return extractList(raw).map(parseCard);
  }

  /** Get full card details including number and CVV. WARNING: Returns sensitive data. */
  async getCardDetails(cardId: string): Promise<CardDetails> {
    const raw = await this.get<Record<string, any>>(`/v1/agent/cards/${cardId}/details`);
    return {
      cardNumber: raw.card_number ?? "",
      cvv: raw.cvv ?? "",
      expiryMonth: raw.expiry_month ?? 0,
      expiryYear: raw.expiry_year ?? 0,
      cardholderName: raw.cardholder_name ?? "",
    };
  }

  // -----------------------------------------------------------------------
  // Statements
  // -----------------------------------------------------------------------

  /** List billing statements. */
  async listStatements(limit = 50): Promise<Statement[]> {
    const raw = await this.get("/v1/statements", { limit });
    return extractList(raw).map(parseStatement);
  }

  /** Get a specific billing statement. */
  async getStatement(statementId: string): Promise<Statement> {
    const raw = await this.get(`/v1/statements/${statementId}`);
    return parseStatement(raw);
  }
}
