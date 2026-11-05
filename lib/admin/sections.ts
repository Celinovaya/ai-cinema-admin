export type Field = {
  name: string;
  label: string;
  type: "text" | "textarea" | "boolean" | "number" | "email" | "domain" | "url" | "provider";
  required?: boolean;
  defaultValue?: string | boolean;
  min?: number;
  max?: number;
  step?: string;
};

export type Section = {
  slug: string;
  table: string;
  title: string;
  description: string;
  mode: "read" | "update" | "crud";
  columns: string[];
  fields: Field[];
  order: string;
};

const active: Field = { name: "is_active", label: "Active", type: "boolean", defaultValue: true };
const notes: Field = { name: "notes", label: "Notes", type: "textarea" };
const timestamps = ["created_at", "updated_at"];

export const sections: Section[] = [
  { slug: "prompt-chains", table: "prompt_chains", title: "Prompt Chains", description: "Review the prompt workflows available to AI Cinema.", mode: "read", columns: ["id", "name", "description", "is_active", "created_at"], fields: [], order: "created_at" },
  { slug: "prompt-chain-steps", table: "prompt_chain_steps", title: "Prompt Chain Steps", description: "Inspect each workflow's ordered steps and complete prompt templates.", mode: "read", columns: ["id", "chain_id", "step_order", "name", "prompt_template", "created_at"], fields: [], order: "chain_id" },
  { slug: "prompt-chain-mix", table: "prompt_chain_mix", title: "Prompt Chain Mix", description: "Adjust the weight and active status of existing chain/model combinations.", mode: "update", columns: ["id", "chain_id", "model_id", "weight", "is_active", "updated_at"], fields: [{ name: "weight", label: "Weight", type: "number", required: true, min: 0, max: 999.99, step: "0.01" }, active], order: "id" },
  { slug: "terms", table: "terms", title: "Terms", description: "Maintain vocabulary, categories, and blocked terms.", mode: "crud", columns: ["id", "term", "category", "is_blocked", "notes", ...timestamps], fields: [{ name: "term", label: "Term", type: "text", required: true }, { name: "category", label: "Category", type: "text" }, { name: "is_blocked", label: "Blocked", type: "boolean", defaultValue: false }, notes], order: "created_at" },
  { slug: "generation-requests", table: "generation_requests", title: "Generation Requests", description: "Read submitted prompts, request status, and associated users and movies.", mode: "read", columns: ["id", "user_id", "movie_id", "prompt", "status", "created_at"], fields: [], order: "created_at" },
  { slug: "ai-generation-examples", table: "ai_generation_examples", title: "AI Generation Examples", description: "Curate example inputs and outputs for AI generation.", mode: "crud", columns: ["id", "title", "input_text", "output_text", "notes", ...timestamps], fields: [{ name: "title", label: "Title", type: "text", required: true }, { name: "input_text", label: "Input text", type: "textarea", required: true }, { name: "output_text", label: "Output text", type: "textarea", required: true }, notes], order: "created_at" },
  { slug: "llm-models", table: "llm_models", title: "LLM Models", description: "Configure model identifiers, providers, and context windows.", mode: "crud", columns: ["id", "provider_id", "name", "model_key", "context_window", "is_active", ...timestamps], fields: [{ name: "provider_id", label: "Provider", type: "provider" }, { name: "name", label: "Name", type: "text", required: true }, { name: "model_key", label: "Model key", type: "text", required: true }, { name: "context_window", label: "Context window (tokens)", type: "number", min: 1, max: 2147483647, step: "1" }, active], order: "created_at" },
  { slug: "llm-providers", table: "llm_providers", title: "LLM Providers", description: "Manage provider names, API base URLs, and availability.", mode: "crud", columns: ["id", "name", "api_base_url", "is_active", ...timestamps], fields: [{ name: "name", label: "Name", type: "text", required: true }, { name: "api_base_url", label: "API base URL", type: "url" }, active], order: "created_at" },
  { slug: "llm-responses", table: "llm_responses", title: "LLM Responses", description: "Inspect complete responses, model references, latency, and token usage.", mode: "read", columns: ["id", "request_id", "model_id", "response_text", "latency_ms", "token_count", "created_at"], fields: [], order: "created_at" },
  { slug: "allowed-signup-domains", table: "allowed_signup_domains", title: "Allowed Signup Domains", description: "Manage the domains allowed to sign up.", mode: "crud", columns: ["id", "domain", "is_active", ...timestamps], fields: [{ name: "domain", label: "Domain", type: "domain", required: true }, active], order: "created_at" },
  { slug: "whitelisted-emails", table: "whitelisted_emails", title: "Whitelisted Emails", description: "Manage individual email addresses allowed to sign up.", mode: "crud", columns: ["id", "email", "is_active", ...timestamps], fields: [{ name: "email", label: "Email address", type: "email", required: true }, active], order: "created_at" },
];

export function getSection(slug: string) {
  return sections.find((section) => section.slug === slug);
}

export type AdminRecord = Record<string, string | number | boolean | null> & { id: string };
export type ProviderOption = { id: string; name: string };

export function labelFor(column: string) {
  return column.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
