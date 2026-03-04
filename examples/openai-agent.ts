/**
 * OpenAI function calling agent that uses Mithril to pay for API data.
 *
 * The agent can look up paid data sources on behalf of the user.
 * When it decides it needs external data, it calls the pay_for_data tool,
 * which uses Mithril to handle payment automatically.
 *
 * Dependencies: npm install @trymithril/sdk openai
 */

import { Mithril, MithrilError } from "@trymithril/sdk";
import OpenAI from "openai";

const mithril = new Mithril(); // reads MITHRIL_API_KEY from env
const openai = new OpenAI();

const tools: OpenAI.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "pay_for_data",
      description:
        "Fetch data from a paid API endpoint. Mithril handles payment automatically using the agent's credit line.",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "The API endpoint URL to fetch data from",
          },
        },
        required: ["url"],
      },
    },
  },
];

async function handleToolCall(name: string, args: Record<string, string>): Promise<string> {
  if (name === "pay_for_data") {
    try {
      const result = await mithril.pay(args.url);
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
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content:
        "You are a research assistant. Use the pay_for_data tool to fetch information from paid APIs when needed.",
    },
    { role: "user", content: userMessage },
  ];

  while (true) {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      tools,
    });

    const message = response.choices[0].message;
    messages.push(message);

    if (message.tool_calls) {
      for (const toolCall of message.tool_calls) {
        const result = await handleToolCall(
          toolCall.function.name,
          JSON.parse(toolCall.function.arguments)
        );
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result,
        });
      }
    } else {
      console.log(message.content);
      break;
    }
  }
}

runAgent(
  "Look up the current weather in New York from https://api.example.com/weather?city=nyc"
);
