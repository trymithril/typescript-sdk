# @trymithril/sdk

Credit-backed payments for AI agents. Give your agent an API key, call `pay()`, and Mithril handles x402 negotiation, payment, and retry automatically.

## Install

```bash
npm install @trymithril/sdk
```

## Quick start

```typescript
import { Mithril } from "@trymithril/sdk";

const mithril = new Mithril(); // uses MITHRIL_API_KEY from env, or pass { apiKey: "..." }

const result = await mithril.pay("https://api.example.com/data");

console.log(result.response); // The service's response (decoded)
console.log(result.payment.amount); // "0.05"
console.log(result.payment.txHash); // "0xabc..."
```

## Usage

### Basic GET request

```typescript
const result = await mithril.pay("https://api.example.com/data");
```

### POST (or PUT, PATCH, DELETE) with body

```typescript
const result = await mithril.pay("https://api.example.com/query", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query: "hello" }),
});
```

### Response

`pay()` returns a `PayResult`:

```typescript
{
  status: "completed",
  response: { ... },       // Decoded response from the service
  responseStatusCode: 200,  // HTTP status from the service
  payment: {
    amount: "0.05",         // What was paid
    currency: "USDC",
    network: "base",
    txHash: "0xabc...",     // On-chain proof
    depositUsed: "0.03",    // Paid from your deposit balance
    creditUsed: "0.02",     // Paid from your credit line
  }
}
```

### API key (env or constructor)

The client needs an API key. Either set the environment variable:

```bash
export MITHRIL_API_KEY=your-api-key
```

```typescript
const mithril = new Mithril(); // reads from env
```

Or pass it in the constructor:

```typescript
const mithril = new Mithril({ apiKey: "your-api-key" });
```

If neither is set, the constructor throws.

### Error handling

```typescript
import { Mithril, MithrilError } from "@trymithril/sdk";

try {
  await mithril.pay("https://api.example.com/data");
} catch (e) {
  if (e instanceof MithrilError) {
    console.error(e.message);    // "Insufficient funds"
    console.error(e.code);       // "insufficient_funds"
    console.error(e.statusCode); // 400
  }
}
```

## Setup

1. Sign up at [app.trymithril.com](https://app.trymithril.com/sign-up)
2. Create an agent and generate an API key
3. Pass the key to the SDK (env `MITHRIL_API_KEY` or `new Mithril({ apiKey: "..." })`)

## Requirements

- Node.js 18+
- A Mithril API key

## License

MIT
