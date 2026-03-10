export interface MithrilConfig {
  /** Your Mithril agent API key. Falls back to MITHRIL_API_KEY env var. */
  apiKey?: string;
  /** API base URL. Defaults to https://api.trymithril.com */
  baseUrl?: string;
}

export interface PayOptions {
  /** HTTP method for the target URL. Defaults to GET. */
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  /** Headers to forward to the target URL. */
  headers?: Record<string, string>;
  /** Request body string for POST/PUT requests. */
  body?: string;
}

// ---------------------------------------------------------------------------
// Wallet & Address
// ---------------------------------------------------------------------------

export interface WalletAddress {
  network: string;
  address: string;
}

export interface Wallet {
  id: string;
  label: string;
  isPrimary: boolean;
  creditLimit: string;
  apr: string;
  outstandingBalance: string;
  accruedInterest: string;
  availableCredit: string;
  totalOwed: string;
  creditStatus: string;
  depositBalance: string;
  spendingPower: string;
  addresses: WalletAddress[];
  isFrozen: boolean;
  autoCollectMode: string;
  billingDay: number;
  gracePeriodActive: boolean;
  missedPayments: number;
  rewardBalance: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Agent
// ---------------------------------------------------------------------------

export interface Agent {
  id: string;
  name: string;
  status: string;
  wallets: Wallet[];
  createdAt: string;
}

export interface AgentStats {
  totalOrders: number;
  totalPnl: string;
  outstandingDebt: string;
  activeLoans: number;
}

// ---------------------------------------------------------------------------
// Spending Power
// ---------------------------------------------------------------------------

export interface WalletSpendingPower {
  walletId: string;
  label: string;
  isPrimary: boolean;
  depositBalance: string;
  availableCredit: string;
  spendingPower: string;
  rewardBalance: string;
}

export interface SpendingPower {
  depositBalance: string;
  creditAvailable: string;
  totalSpendingPower: string;
  wallets: WalletSpendingPower[];
  rewardBalance: string;
}

// ---------------------------------------------------------------------------
// Balance Sheet
// ---------------------------------------------------------------------------

export interface WalletBalance {
  walletId: string;
  label: string;
  isPrimary: boolean;
  network: string;
  address: string;
  balanceUsdc: string;
}

export interface PositionItem {
  tokenId: string;
  marketId: string;
  exchange: string;
  side: string;
  quantity: string;
  costBasis: string;
  currentPrice?: string;
  marketValue?: string;
}

export interface Assets {
  cash: WalletBalance[];
  totalCash: string;
  positions: PositionItem[];
  totalPositions: string;
  totalAssets: string;
}

export interface LoanItem {
  loanId: string;
  status: string;
  principal: string;
  outstandingBalance: string;
  accruedInterest: string;
}

export interface Liabilities {
  loans: LoanItem[];
  totalOutstanding: string;
  totalInterest: string;
  totalLiabilities: string;
}

export interface BalanceSheet {
  agentId: string;
  assets: Assets;
  liabilities: Liabilities;
  netEquity: string;
  computedAt: string;
}

// ---------------------------------------------------------------------------
// Credit Profile
// ---------------------------------------------------------------------------

export interface CreditProfile {
  agentId: string;
  totalLoans: number;
  activeLoans: number;
  successfulLoans: number;
  defaultedLoans: number;
  missedPaymentsEver: number;
  tier: string;
  historyScore: number;
  firstLoanAt?: string;
  lastLoanAt?: string;
}

// ---------------------------------------------------------------------------
// Billing
// ---------------------------------------------------------------------------

export interface RepaymentAddress {
  network: string;
  address: string;
}

export interface BillingInfo {
  walletId: string;
  outstandingBalance: string;
  accruedInterest: string;
  totalOwed: string;
  minimumPayment: string;
  dueDate: string;
  apr: string;
  billingDay: number;
  gracePeriodActive: boolean;
  repaymentAddresses: RepaymentAddress[];
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

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

export interface SendResult {
  /** On-chain transaction hash. */
  txHash: string;
  /** USDC amount sent. */
  amount: string;
  /** Network the transfer was made on. */
  network: string;
  /** How much came from deposit balance. */
  depositUsed: string;
  /** How much came from credit (always "0" for send). */
  creditUsed: string;
}

// ---------------------------------------------------------------------------
// Reconcile
// ---------------------------------------------------------------------------

export interface ReconcileResult {
  amountApplied: string;
  remainingBalance: string;
  depositBalance: string;
  txHash?: string;
  network?: string;
  autoCollectMode: string;
}

// ---------------------------------------------------------------------------
// Transactions & Ledger
// ---------------------------------------------------------------------------

export interface Transaction {
  id: string;
  amount: string;
  currency: string;
  entryType: string;
  description: string;
  createdAt: string;
  network?: string;
  txHash?: string;
  merchantDomain?: string;
  merchantEndpoint?: string;
  explorerUrl?: string;
}

export interface LedgerEntry {
  id: string;
  amount: string;
  currency: string;
  entryType: string;
  description: string;
  createdAt: string;
  debitAccount?: string;
  creditAccount?: string;
  referenceId?: string;
  network?: string;
  txHash?: string;
}

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

export interface Card {
  id: string;
  walletId: string;
  label: string;
  lastFour: string;
  status: string;
  singleLimit: string;
  dailyLimit: string;
  monthlyLimit: string;
  createdAt: string;
}

export interface CardDetails {
  cardNumber: string;
  cvv: string;
  expiryMonth: number;
  expiryYear: number;
  cardholderName: string;
}

// ---------------------------------------------------------------------------
// Statements
// ---------------------------------------------------------------------------

export interface Statement {
  id: string;
  walletId: string;
  statementPeriodStart: string;
  statementPeriodEnd: string;
  previousBalance: string;
  purchases: string;
  cashAdvances: string;
  fees: string;
  interest: string;
  payments: string;
  finalBalance: string;
  minimumDue: string;
  dueDate: string;
  transactionCount: number;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Internal API types (snake_case from server)
// ---------------------------------------------------------------------------

/** Raw error envelope from the Mithril API. */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

/** Raw payment object from the Mithril API (snake_case). */
export interface ApiPayment {
  amount: string;
  currency: string;
  network: string;
  tx_hash: string;
  deposit_used: string;
  credit_used: string;
}

/** Raw response from /v1/agent/pay. */
export interface PayApiResponse {
  status: string;
  response?: {
    body?: string;
    status_code?: number;
  };
  payment?: ApiPayment;
}
