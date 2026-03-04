import type { RegisteredTool } from "./registry.js";
import type { JobListing, RemotiveResponse } from "../types.js";
import { CONFIG } from "../config.js";

// Module-level cache shared with getJobDetails
export const jobCache = new Map<number, JobListing>();

/** Strip HTML tags and decode common entities */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, " ")
    .trim();
}

function formatJobSummary(job: JobListing, index: number): string {
  const salary = job.salary || "salary not listed";
  const location = job.candidate_required_location || "location not specified";
  const tags = job.tags.slice(0, 6).join(", ") || "no tags";
  const posted = new Date(job.publication_date).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
  return `${index + 1}. [ID:${job.id}] ${job.title} — ${job.company_name}\n   ${salary} | ${location} | ${job.job_type}\n   Tags: ${tags}\n   Posted: ${posted}\n   URL: ${job.url}`;
}

export const searchJobsTool: RegisteredTool = {
  definition: {
    name: "search_jobs",
    description:
      "Search remote job listings on Remotive by keyword. Returns a summary list of matching jobs with IDs. " +
      "Use get_job_details to fetch the full description for a specific job.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search keywords e.g. 'machine learning engineer', 'typescript AI agent'",
        },
        category: {
          type: "string",
          description:
            "Optional Remotive category slug to narrow results: " +
            "'software-dev', 'ai-ml', 'devops-sysadmin', 'data-analysis', 'product', 'design', 'marketing', 'customer-support'",
        },
        limit: {
          type: "number",
          description: "Max results to return (default 10, max 20)",
        },
      },
      required: ["query"],
    },
  },

  async execute(input) {
    const query = String(input["query"] ?? "").trim();
    const category = input["category"] ? String(input["category"]) : undefined;
    const limit = Math.min(Number(input["limit"] ?? 10), 20);

    const url = new URL(CONFIG.REMOTIVE_BASE_URL);
    url.searchParams.set("search", query);
    if (category) url.searchParams.set("category", category);

    let data: RemotiveResponse;
    try {
      const res = await fetch(url.toString());
      if (!res.ok) return `Remotive API error: ${res.status} ${res.statusText}`;
      data = await res.json() as RemotiveResponse;
    } catch (err) {
      return `Network error: ${err instanceof Error ? err.message : String(err)}`;
    }

    const jobs = data.jobs.slice(0, limit);
    if (jobs.length === 0) {
      return `No jobs found for "${query}"${category ? ` in category "${category}"` : ""}. Try broader keywords or a different category.`;
    }

    // Cache full listings for get_job_details
    for (const job of jobs) {
      jobCache.set(job.id, { ...job, description: stripHtml(job.description) });
    }

    const summaries = jobs.map((j, i) => formatJobSummary(j, i)).join("\n\n");
    return `Found ${jobs.length} jobs (${data["total-job-count"]} total on Remotive) for "${query}":\n\n${summaries}`;
  },
};
