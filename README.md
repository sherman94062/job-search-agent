# job-search-agent

A conversational CLI agent that searches multiple job boards simultaneously and presents results in a clean, ranked format. Built with Claude Sonnet 4.6 and the Anthropic SDK.

## What It Does

You chat with the agent in your terminal. It searches LinkedIn, Indeed, Glassdoor, The Muse, and Adzuna in parallel, then reasons over the results and surfaces the best matches — with salary data, required skills, and direct apply links.

```
You: find me AI engineer jobs in Austin

  🔧 search_jsearch  { query: "AI engineer Austin TX" }         → 10 results (1.2s)
  🔧 search_muse     { query: "AI engineer" }                   → 8 results (0.9s)

  Here are the top matches across LinkedIn, Indeed, and The Muse:

  1. [ID:4312847] AI Platform Engineer — Nvidia
     $160k–$200k | Austin, TX | full_time
     Skills: Python, PyTorch, CUDA, Kubernetes
     Posted: Mar 3, 2026
     URL: https://...
  ...
```

The agent maintains conversation history, so you can follow up naturally:

```
You: tell me more about job 2
You: which ones offer visa sponsorship?
You: filter to just roles that mention LLMs
```

## How It Works

The agent runs a streaming agentic loop powered by Claude Sonnet 4.6 with extended thinking:

1. You send a message
2. Claude reasons over the available tools and decides which to call
3. Tools execute concurrently and results feed back into context
4. Claude synthesizes results into a ranked, opinionated response
5. The loop repeats (up to 6 iterations) until Claude reaches a final answer

### Tools

| Tool | Source | Auth |
|------|--------|------|
| `search_jsearch` | JSearch (LinkedIn + Indeed + Glassdoor) | `RAPIDAPI_KEY` |
| `search_muse` | The Muse | none |
| `search_adzuna` | Adzuna | `ADZUNA_APP_ID` + `ADZUNA_APP_KEY` |
| `get_job_details` | any cached job | none |

All search tools populate a shared in-memory `jobCache` keyed by numeric ID, so `get_job_details` works for any job from any source. Non-numeric IDs from Adzuna and JSearch are mapped to distinct numeric ranges using a djb2 hash.

Each tool degrades gracefully if its API key is missing — it returns a plain-English message and the agent falls back to whichever sources are available.

### Default Behavior

- **Default search term**: `"AI"` (broad, captures AI engineer, AI researcher, AI product, etc.)
- **Default location**: `Austin, Texas` (worldwide/remote roles always included)
- **Default job type**: `full_time`
- **Search strategy**: always queries at least 2 sources before reporting

## Setup

```bash
git clone https://github.com/sherman94062/job-search-agent
cd job-search-agent
npm install
cp .env.example .env
```

Edit `.env` and add your keys:

```env
ANTHROPIC_API_KEY=your_key_here

# Adzuna — https://developer.adzuna.com/ (free)
ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_APP_KEY=your_adzuna_app_key

# JSearch via RapidAPI — https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch (free tier)
RAPIDAPI_KEY=your_rapidapi_key
```

The Muse requires no key and works out of the box.

## Usage

```bash
npm start       # run the agent
npm run dev     # run with file watching (auto-restarts on code changes)
```

Type `exit`, `quit`, or `:q` to quit.

## Project Structure

```
src/
  index.ts            # REPL entry point — readline loop
  config.ts           # env vars, defaults, model config
  types.ts            # shared TypeScript types
  display.ts          # terminal formatting (colors, banners, usage stats)
  agent/
    client.ts         # Anthropic SDK client + thinking config
    runner.ts         # streaming agentic tool loop
    prompt.ts         # system prompt + search strategy instructions
  tools/
    registry.ts       # tool registry (register, lookup, execute)
    index.ts          # registers all active tools
    searchJobs.ts     # shared jobCache (used by all search tools)
    searchJSearch.ts  # JSearch / RapidAPI tool
    searchMuse.ts     # The Muse tool
    searchAdzuna.ts   # Adzuna tool
    getJobDetails.ts  # fetch full job description from cache
```

## Tech Stack

- **Runtime**: Node 24 + tsx (no build step required)
- **LLM**: Claude Sonnet 4.6 with extended thinking
- **SDK**: `@anthropic-ai/sdk` 0.51
- **Language**: TypeScript 5.7, ESM, NodeNext resolution
