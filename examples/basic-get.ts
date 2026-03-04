/**
 * Basic GET request — pay for a resource and print the response.
 *
 * Dependencies: npm install @trymithril/sdk
 */

import { Mithril } from "@trymithril/sdk";

const mithril = new Mithril(); // reads MITHRIL_API_KEY from env

const result = await mithril.pay("https://api.example.com/weather?city=nyc");

console.log(`Status: ${result.status}`);
console.log("Response:", result.response);
console.log(`Paid: ${result.payment.amount} ${result.payment.currency}`);
console.log(`Tx: ${result.payment.txHash}`);
