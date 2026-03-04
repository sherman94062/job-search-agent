// ── Remotive API ──────────────────────────────────────────────────────────────

export interface JobListing {
  id: number;
  title: string;
  company_name: string;
  category: string;
  tags: string[];
  job_type: string;
  salary: string;
  candidate_required_location: string;
  url: string;
  publication_date: string;
  description: string; // HTML — strip before passing to Claude
}

export interface RemotiveResponse {
  "job-count": number;
  "total-job-count": number;
  jobs: JobListing[];
}

export interface JobCategory {
  id: number;
  name: string;
  slug: string;
}

export interface CategoriesResponse {
  jobs: JobCategory[];
}

// ── Streaming ─────────────────────────────────────────────────────────────────

export type DeltaEvent =
  | { type: "thinking"; delta: string }
  | { type: "text";     delta: string }
  | { type: "tool_start";  tool: string; input: Record<string, unknown> }
  | { type: "tool_result"; tool: string; result: string; duration_ms: number };

export type DeltaCallback = (event: DeltaEvent) => void;
