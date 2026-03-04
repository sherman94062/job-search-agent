import { readFileSync } from "fs";
import { resolve } from "path";

try {
  const envPath = resolve(process.cwd(), ".env");
  const lines = readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
} catch {
  // .env not present — rely on shell environment
}

export const CONFIG = {
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? "",
  MODEL: "claude-sonnet-4-6",
  MAX_TOKENS: 8192,
  MAX_TOOL_ITERATIONS: 6,
  REMOTIVE_BASE_URL: "https://remotive.com/api/remote-jobs",

  ADZUNA_APP_ID:  process.env.ADZUNA_APP_ID  ?? "",
  ADZUNA_APP_KEY: process.env.ADZUNA_APP_KEY ?? "",
  RAPIDAPI_KEY:   process.env.RAPIDAPI_KEY   ?? "",

  // Default search preferences (user can override per query)
  DEFAULT_LOCATION:  "Austin, Texas",
  DEFAULT_JOB_TYPE:  "full_time",
  DEFAULT_JOB_TITLE: "AI",

  // Pricing for claude-sonnet-4-6 ($ per million tokens)
  PRICE_INPUT_PER_M:  3.00,
  PRICE_OUTPUT_PER_M: 15.00,
} as const;

if (!CONFIG.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key.");
  process.exit(1);
}
