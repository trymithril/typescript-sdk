/**
 * POST request with JSON body — pay for a resource that requires input.
 *
 * Dependencies: npm install @trymithril/sdk
 */

import { Mithril } from "@trymithril/sdk";

const mithril = new Mithril(); // reads MITHRIL_API_KEY from env

const result = await mithril.pay("https://api.example.com/search", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    query: "latest AI research papers",
    limit: 5,
  }),
});

console.log(`Status: ${result.status}`);
console.log(`HTTP ${result.responseStatusCode}`);
console.log("Results:", result.response);
console.log(`Cost: ${result.payment.amount} ${result.payment.currency}`);
console.log(`  Deposit used: ${result.payment.depositUsed}`);
console.log(`  Credit used:  ${result.payment.creditUsed}`);
