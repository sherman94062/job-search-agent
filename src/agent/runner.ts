import type Anthropic from "@anthropic-ai/sdk";
import { anthropic, THINKING_PARAM } from "./client.js";
import { toolRegistry } from "../tools/index.js";
import { SYSTEM_PROMPT } from "./prompt.js";
import { CONFIG } from "../config.js";
import type { DeltaCallback } from "../types.js";

export interface RunResult {
  text: string;
  usage: { input_tokens: number; output_tokens: number };
}

/**
 * Runs the job search agent with a full streaming agentic tool loop.
 * Mutates `messages` in place — caller owns the session history.
 */
export async function runAgent(
  messages: Anthropic.MessageParam[],
  onDelta: DeltaCallback,
): Promise<RunResult> {
  const usage = { input_tokens: 0, output_tokens: 0 };
  let finalText = "";

  for (let i = 0; i < CONFIG.MAX_TOOL_ITERATIONS; i++) {
    const stream = anthropic.messages.stream({
      model: CONFIG.MODEL,
      max_tokens: CONFIG.MAX_TOKENS,
      thinking: THINKING_PARAM,
      system: SYSTEM_PROMPT,
      tools: toolRegistry.definitions(),
      messages,
    });

    const toolUseAccumulator = new Map<number, { id: string; name: string; inputJson: string }>();

    for await (const event of stream) {
      if (event.type === "message_start") {
        usage.input_tokens += event.message.usage.input_tokens;
      }

      if (event.type === "content_block_start" && event.content_block.type === "tool_use") {
        toolUseAccumulator.set(event.index, {
          id: event.content_block.id,
          name: event.content_block.name,
          inputJson: "",
        });
      }

      if (event.type === "content_block_delta") {
        const delta = event.delta;
        if (delta.type === "thinking_delta") {
          onDelta({ type: "thinking", delta: delta.thinking });
        }
        if (delta.type === "text_delta") {
          onDelta({ type: "text", delta: delta.text });
        }
        if (delta.type === "input_json_delta") {
          const acc = toolUseAccumulator.get(event.index);
          if (acc) acc.inputJson += delta.partial_json;
        }
      }

      if (event.type === "message_delta") {
        usage.output_tokens += event.usage.output_tokens ?? 0;
      }
    }

    const finalMessage = await stream.finalMessage();

    for (const block of finalMessage.content) {
      if (block.type === "text") finalText = block.text;
    }

    if (finalMessage.stop_reason === "end_turn") break;

    if (finalMessage.stop_reason === "tool_use") {
      messages.push({ role: "assistant", content: finalMessage.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of finalMessage.content) {
        if (block.type !== "tool_use") continue;

        const input = block.input as Record<string, unknown>;
        onDelta({ type: "tool_start", tool: block.name, input });

        const start = Date.now();
        let result: string;
        try {
          result = await toolRegistry.execute(block.name, input);
        } catch (err) {
          result = `Error: ${err instanceof Error ? err.message : String(err)}`;
        }
        const duration_ms = Date.now() - start;

        onDelta({ type: "tool_result", tool: block.name, result, duration_ms });
        toolResults.push({ type: "tool_result", tool_use_id: block.id, content: result });
      }

      messages.push({ role: "user", content: toolResults });
      continue;
    }

    break;
  }

  return { text: finalText, usage };
}
