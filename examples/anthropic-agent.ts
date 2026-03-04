/**
 * Anthropic tool_use agent that uses Mithril to pay for API data.
 *
 * The agent can fetch paid data sources using Claude's tool_use capability.
 * When Claude decides it needs external data, it invokes the pay_for_data tool,
 * which uses Mithril to handle payment automatically.
 *
 * Dependencies: npm install @trymithril/sdk @anthropic-ai/sdk
 */

import { Mithril, MithrilError } from "@trymithril/sdk";
import Anthropic from "@anthropic-ai/sdk";

const mithril = new Mithril(); // reads MITHRIL_API_KEY from env
const anthropic = new Anthropic();

const tools: Anthropic.Tool[] = [
  {
    name: "pay_for_data",
    description:
      "Fetch data from a paid API endpoint. Mithril handles payment automatically using the agent's credit line.",
    input_schema: {
      type: "object" as const,
      properties: {
        url: {
          type: "string",
          description: "The API endpoint URL to fetch data from",
        },
      },
      required: ["url"],
    },
  },
];

async function handleToolCall(
  name: string,
  input: Record<string, string>
): Promise<string> {
  if (name === "pay_for_data") {
    try {
      const result = await mithril.pay(input.url);
      return JSON.stringify({
        data: result.response,
        cost: `${result.payment.amount} ${result.payment.currency}`,
      });
    } catch (e) {
      if (e instanceof MithrilError) {
        return JSON.stringify({ error: e.message, code: e.code });
      }
      throw e;
    }
  }
  return JSON.stringify({ error: `Unknown tool: ${name}` });
}

async function runAgent(userMessage: string) {
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userMessage },
  ];

  while (true) {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system:
        "You are a research assistant. Use the pay_for_data tool to fetch information from paid APIs when needed.",
      tools,
      messages,
    });

    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason === "tool_use") {
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type === "tool_use") {
          const result = await handleToolCall(
            block.name,
            block.input as Record<string, string>
          );
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: result,
          });
        }
      }
      messages.push({ role: "user", content: toolResults });
    } else {
      for (const block of response.content) {
        if (block.type === "text") {
          console.log(block.text);
        }
      }
      break;
    }
  }
}

runAgent(
  "Look up the current weather in New York from https://api.example.com/weather?city=nyc"
);
