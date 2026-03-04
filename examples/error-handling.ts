/**
 * Error handling — catch and inspect API errors.
 *
 * Dependencies: npm install @trymithril/sdk
 */

import { Mithril, MithrilError } from "@trymithril/sdk";

const mithril = new Mithril(); // reads MITHRIL_API_KEY from env

try {
  const result = await mithril.pay("https://api.example.com/premium-data");
  console.log("Success:", result.response);
} catch (e) {
  if (e instanceof MithrilError) {
    console.error(`Error: ${e.message}`);
    console.error(`Code:  ${e.code}`); // e.g. "insufficient_funds", "unauthorized"
    console.error(`HTTP:  ${e.statusCode}`); // e.g. 400, 401, 402

    if (e.code === "insufficient_funds") {
      console.log("Top up your balance at https://app.trymithril.com");
    } else if (e.code === "unauthorized") {
      console.log("Check your API key");
    } else {
      console.log("Something went wrong — contact support");
    }
  } else {
    throw e;
  }
}
