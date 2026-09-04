const deployedUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined;

export const site = {
  name: "Harpreet Kaur",
  email: "harpreetkaur622@gmail.com",
  location: "New York, NY",
  github: "https://github.com/hkaur2001",
  linkedin: "https://www.linkedin.com/in/harpreet-kaur-0501/",
  tagline: "Software engineer building full-stack products, AI systems, and production infrastructure.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? deployedUrl ?? "http://localhost:3000",
};

export const impact = [
  { value: "40K+", label: "enterprise users", detail: "Systems built for organization-scale adoption, not isolated demos." },
  { value: "8+", label: "enterprise integrations", detail: "Knowledge and workflow systems spanning multiple internal platforms." },
  { value: "500K+", label: "knowledge assets", detail: "Production pipelines designed around messy, changing enterprise content." },
  { value: "End-to-end", label: "delivery ownership", detail: "Discovery → architecture → implementation → monitoring → rollout." },
];

export const capabilities = [
  {
    title: "Full-stack product engineering",
    body: "I build the user-facing product and the systems behind it: React and TypeScript interfaces, API contracts, backend services, state, validation, and deployment workflows.",
    proof: ["React + TypeScript", "Next.js", "API design", "FastAPI", "Testing"],
  },
  {
    title: "Applied AI & agent systems",
    body: "I use models where they create leverage, then surround them with retrieval, explicit tools, permission boundaries, evaluation, and human review so the result behaves like software rather than a prompt demo.",
    proof: ["RAG", "Tool orchestration", "MCP-style contracts", "Evals", "Human approval gates"],
  },
  {
    title: "Data, integrations & automation",
    body: "I connect systems that were not designed to work together, move messy data reliably, normalize contracts, and turn fragmented workflows into repeatable automation.",
    proof: ["Enterprise APIs", "OAuth2", "Data pipelines", "Metadata", "Workflow orchestration"],
  },
  {
    title: "Production engineering",
    body: "I design for the parts that matter after launch: observability, failure recovery, latency, cost, access control, CI/CD, and an operating model that lets a system change safely.",
    proof: ["Docker", "GitHub Actions", "Observability", "Guardrails", "Cost / latency budgets"],
  },
];

export const engineeringSurface = [
  { label: "Frontend", value: "React · TypeScript · Next.js", proof: "Live portfolio + interactive workflows" },
  { label: "Backend", value: "Next.js APIs · Python · FastAPI", proof: "Server-executed labs + reference runtime" },
  { label: "AI systems", value: "Retrieval · tools · permissions · evals", proof: "ContextOps + deployment workflows" },
  { label: "Production", value: "Docker · CI/CD · monitoring · security", proof: "Containerized runtime + automated checks" },
];

export const principles = [
  ["Start with the problem, not the model", "I first map the user, workflow, decision, data, action, and failure cost. AI is one implementation choice inside a larger system."],
  ["Make system behavior inspectable", "A good deployment should make data flow, tool calls, permissions, metrics, and failure modes visible enough to debug."],
  ["Evaluate the system, not just the model", "Retrieval quality, tool correctness, latency, cost, security, and user trust all determine production quality."],
  ["Design for change", "Models, APIs, schemas, requirements, and data all move. Good systems make those changes observable and reversible."],
];

export const experienceHighlights = [
  {
    company: "S&P Global",
    role: "Software & Platform Engineer · AI systems",
    body: "Built and productionized enterprise AI and data infrastructure around Spark Assist, connecting live knowledge and workflow systems while partnering across engineering, IT, security, and business teams.",
    bullets: [
      "Owned integration patterns spanning 8+ enterprise systems and more than 500K knowledge assets.",
      "Built reusable onboarding, routing, validation, monitoring, and failure-recovery patterns for enterprise knowledge pipelines.",
      "Designed permission-aware collection behavior, metadata filtering, and multi-collection retrieval patterns for large-scale internal AI experiences.",
      "Translated ambiguous internal use cases into shipped systems designed for an enterprise user population of 40K+.",
    ],
  },
];

export type LabSlug = "context-ops" | "solution-architect" | "incident-commander";

export type LabDefinition = {
  slug: LabSlug;
  kicker: string;
  title: string;
  summary: string;
  problem: string;
  workflow: string[];
  skills: string[];
  stack: string[];
  signals: string[];
};

export const labs: LabDefinition[] = [
  {
    slug: "context-ops",
    kicker: "Retrieval · security · agent tools",
    title: "ContextOps",
    summary: "A working permission-aware knowledge workflow that retrieves evidence, filters access before answer generation, explains each tool call, and emits run-level evaluation signals.",
    problem: "Employees need answers from fragmented knowledge, but the system must never leak a document the current user is not allowed to read.",
    workflow: ["Resolve user identity", "Retrieve relevant sources", "Filter by ACL", "Run task-specific tool", "Compose cited result", "Evaluate the run"],
    skills: ["Retrieval", "Access control", "Tool orchestration", "RAG evaluation", "Observability"],
    stack: ["Next.js API route", "TypeScript", "Server-side retrieval", "Python/FastAPI reference runtime"],
    signals: ["Server-executed", "ACL pre-filter", "Citations", "Run trace", "No paid API required"],
  },
  {
    slug: "solution-architect",
    kicker: "Product discovery · architecture · ROI",
    title: "Deployment Architect",
    summary: "A working discovery and solution-design workflow that turns an ambiguous AI request into missing questions, an architecture, a measurable pilot, and ROI math only when the input supports it.",
    problem: "Teams often start with ‘we want an AI agent’ rather than a measurable workflow, technical constraints, or launch criteria.",
    workflow: ["Parse the brief", "Surface missing discovery data", "Assess delivery risk", "Compose architecture", "Calculate value from supplied baselines", "Define launch gates"],
    skills: ["Technical discovery", "System design", "ROI modeling", "Product sense", "Evaluation planning"],
    stack: ["Next.js API route", "TypeScript tool engine", "Structured outputs", "Deterministic calculations"],
    signals: ["Server-executed", "No invented ROI", "Architecture", "Launch criteria", "Measurable pilot"],
  },
  {
    slug: "incident-commander",
    kicker: "Reliability · observability · safe actions",
    title: "AI Incident Commander",
    summary: "A working reliability workflow that compares telemetry, ranks likely failure domains, selects a reversible mitigation, and blocks risky write actions while preserving evidence.",
    problem: "When an AI system degrades, the cause may be retrieval, data, tools, orchestration, or the model. Prompt tuning before diagnosis can make the incident worse.",
    workflow: ["Load current + baseline telemetry", "Calculate deltas", "Rank hypotheses", "Match a runbook", "Apply action guard", "Generate regression checks"],
    skills: ["Observability", "Failure isolation", "Guardrails", "Incident response", "Regression testing"],
    stack: ["Next.js API route", "TypeScript diagnostics", "Structured telemetry fixtures", "CI regression tests"],
    signals: ["Server-executed", "Telemetry deltas", "Reversible-first", "Guardrails", "Regression plan"],
  },
];
