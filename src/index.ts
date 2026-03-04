#!/usr/bin/env tsx
import * as readline from "readline";
import type Anthropic from "@anthropic-ai/sdk";
import { runAgent } from "./agent/runner.js";
import * as display from "./display.js";

async function main(): Promise<void> {
  display.printBanner();

  const messages: Anthropic.MessageParam[] = [];
  const EXIT_COMMANDS = new Set(["exit", "quit", ":q"]);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  const prompt = (): void => {
    rl.question(display.userPrompt(), async (input) => {
      const message = input.trim();

      if (!message) {
        prompt();
        return;
      }

      if (EXIT_COMMANDS.has(message.toLowerCase())) {
        console.log("\x1b[90m\n  Goodbye.\n\x1b[0m");
        rl.close();
        process.exit(0);
      }

      messages.push({ role: "user", content: message });
      display.assistantPrefix();

      try {
        const result = await runAgent(messages, (evt) => display.handleDelta(evt));
        messages.push({ role: "assistant", content: result.text });
        display.printUsage(result.usage);
      } catch (err) {
        display.printError(err instanceof Error ? err.message : String(err));
        // Remove the failed user message so the session stays clean
        messages.pop();
      }

      prompt();
    });
  };

  rl.on("close", () => {
    console.log("\x1b[90m\n  Goodbye.\n\x1b[0m");
    process.exit(0);
  });

  prompt();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
