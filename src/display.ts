import type { DeltaEvent } from "./types.js";
import { CONFIG } from "./config.js";

const c = {
  reset:   "\x1b[0m",
  bold:    "\x1b[1m",
  dim:     "\x1b[2m",
  cyan:    "\x1b[36m",
  green:   "\x1b[32m",
  yellow:  "\x1b[33m",
  red:     "\x1b[31m",
  gray:    "\x1b[90m",
  white:   "\x1b[37m",
};

function paint(color: string, text: string): string {
  return `${color}${text}${c.reset}`;
}

export function printBanner(): void {
  console.log();
  console.log(paint(c.bold + c.cyan,  "  Job Search Agent"));
  console.log(paint(c.gray,           `  model  : ${CONFIG.MODEL}`));
  console.log(paint(c.gray,           `  source   : Remotive (remote jobs, no API key required)`));
  console.log(paint(c.gray,           `  defaults : ${CONFIG.DEFAULT_JOB_TITLE} · ${CONFIG.DEFAULT_LOCATION} · ${CONFIG.DEFAULT_JOB_TYPE}`));
  console.log(paint(c.gray,           `  exit     : type 'exit' or press Ctrl+C`));
  console.log();
  console.log(paint(c.dim,            "  Example queries:"));
  console.log(paint(c.dim,            "    find me jobs  (uses defaults)"));
  console.log(paint(c.dim,            "    senior ML engineer roles in San Francisco"));
  console.log(paint(c.dim,            "    typescript AI agent contract jobs"));
  console.log(paint(c.dim,            "    show me details for job #1234"));
  console.log();
}

export function userPrompt(): string {
  return paint(c.bold + c.cyan, "You: ");
}

export function assistantPrefix(): void {
  process.stdout.write("\n" + paint(c.bold + c.green, "Assistant: "));
}

export function handleDelta(event: DeltaEvent): void {
  switch (event.type) {
    case "thinking":
      // Suppress — not useful at the CLI level
      break;

    case "text":
      process.stdout.write(event.delta);
      break;

    case "tool_start": {
      const args = Object.entries(event.input)
        .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
        .join(", ");
      process.stdout.write(`\n${paint(c.yellow, `  ⚙  ${event.tool}(${args})`)}\n`);
      break;
    }

    case "tool_result": {
      // Show just the first line of the result as a preview
      const preview = event.result.split("\n")[0]?.slice(0, 100) ?? "";
      const suffix = event.result.length > 100 ? "…" : "";
      process.stdout.write(
        paint(c.gray, `  → ${preview}${suffix}  (${event.duration_ms}ms)`) + "\n\n",
      );
      break;
    }
  }
}

export function printUsage(usage: { input_tokens: number; output_tokens: number }): void {
  const inputCost  = (usage.input_tokens  / 1_000_000) * CONFIG.PRICE_INPUT_PER_M;
  const outputCost = (usage.output_tokens / 1_000_000) * CONFIG.PRICE_OUTPUT_PER_M;
  const totalCost  = inputCost + outputCost;
  const costStr    = totalCost < 0.001
    ? `< $0.001`
    : `$${totalCost.toFixed(4)}`;

  process.stdout.write(
    paint(c.gray, `\n  [↑${usage.input_tokens} ↓${usage.output_tokens} tokens · ${costStr}]\n\n`),
  );
}

export function printError(message: string): void {
  console.error(paint(c.red, `\n  Error: ${message}\n`));
}
