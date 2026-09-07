import { NextRequest, NextResponse } from "next/server";
import { fetchJsonWithRetry, openAiUrl } from "@/lib/resilient-fetch";

export const runtime = "nodejs";

type KnowledgeDoc = {
  id: string;
  title: string;
  owner: string;
  groups: string[];
  content: string;
};

const DOCS: KnowledgeDoc[] = [
  { id: "onboarding-policy", title: "Employee Onboarding Policy", owner: "People Systems", groups: ["everyone"], content: "Identity Governance owns final access approval. Standard access reviews should complete within one business day. Managers approve access to restricted role-specific systems." },
  { id: "security-baseline", title: "Security Access Baseline", owner: "Security Engineering", groups: ["everyone"], content: "Use least privilege by default. Production access requires a named owner, an approved business reason, and periodic access review." },
  { id: "sales-runbook", title: "Sales New Hire Runbook", owner: "Sales Operations", groups: ["everyone", "sales-operations"], content: "Confirm identity, provision baseline access, request role-specific tools, obtain manager approval for restricted systems, and verify day-one access." },
  { id: "pricing-playbook", title: "Q3 Pricing Playbook", owner: "Revenue Enablement", groups: ["revenue-enablement"], content: "Enterprise discount exceptions require Revenue Enablement review. Pricing follows approved bands and restricted escalation rules." },
  { id: "renewal-exceptions", title: "Renewal Exception Guide", owner: "Revenue Enablement", groups: ["revenue-enablement"], content: "Non-standard renewal exceptions require Revenue Enablement approval and must be documented in the commercial review workflow." },
];

const PERSONAS: Record<string, string[]> = {
  employee: ["everyone"],
  sales: ["everyone", "sales-operations"],
  revenue: ["everyone", "revenue-enablement"],
};

const STOPWORDS = new Set([
  "a", "an", "and", "are", "be", "for", "from", "how", "i", "in", "is", "it", "of", "on", "or", "the", "to", "what", "when", "where", "which", "who", "why", "with",
]);

const EXPANSIONS: Record<string, string[]> = {
  permission: ["access", "approval", "restricted", "privilege"],
  permissions: ["access", "approval", "restricted", "privilege"],
  authorize: ["access", "approval", "restricted"],
  authorization: ["access", "approval", "restricted"],
  production: ["access", "owner", "review"],
  controls: ["approval", "review", "privilege", "owner"],
  control: ["approval", "review", "privilege", "owner"],
  pricing: ["discount", "commercial", "enterprise"],
  exception: ["exceptions", "approval", "review", "escalation"],
  onboarding: ["new", "hire", "access", "identity"],
};

function stem(token: string) {
  if (token.length > 5 && token.endsWith("ing")) return token.slice(0, -3);
  if (token.length > 4 && token.endsWith("ies")) return `${token.slice(0, -3)}y`;
  if (token.length > 4 && token.endsWith("es")) return token.slice(0, -2);
  if (token.length > 3 && token.endsWith("s")) return token.slice(0, -1);
  return token;
}

function tokenList(text: string) {
  return (text.toLowerCase().match(/[a-z0-9]+/g) ?? [])
    .map(stem)
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

function expandedTerms(text: string) {
  const base = tokenList(text);
  const terms = new Set(base);
  for (const token of base) {
    for (const expansion of EXPANSIONS[token] ?? []) terms.add(stem(expansion));
  }
  return terms;
}

function hybridScore(question: string, doc: KnowledgeDoc) {
  const query = expandedTerms(question);
  if (query.size === 0) return 0;

  const title = new Set(tokenList(doc.title));
  const content = new Set(tokenList(doc.content));
  const owner = new Set(tokenList(doc.owner));
  let weighted = 0;

  for (const term of query) {
    if (title.has(term)) weighted += 2.2;
    else if (content.has(term)) weighted += 1.35;
    else if (owner.has(term)) weighted += 0.8;
  }

  const lowerQuestion = question.toLowerCase();
  const lowerDoc = `${doc.title} ${doc.content}`.toLowerCase();
  const phraseBonuses = ["production access", "role-specific", "pricing", "renewal", "onboarding", "least privilege", "access approval"];
  for (const phrase of phraseBonuses) {
    if (lowerQuestion.includes(phrase) && lowerDoc.includes(phrase)) weighted += 2.5;
  }

  return Math.min(1, weighted / Math.max(4, query.size * 1.8));
}

function responseText(body: unknown) {
  const response = body as { output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && content.text) return content.text;
    }
  }
  return "";
}

async function answerWithModel(question: string, docs: Array<{ doc: KnowledgeDoc; score: number }>, apiKey: string) {
  const context = docs.map(({ doc }) => `[${doc.id}] ${doc.title}\nOwner: ${doc.owner}\n${doc.content}`).join("\n\n");
  return fetchJsonWithRetry<{ output?: Array<{ content?: Array<{ type?: string; text?: string }> }>; usage?: { input_tokens?: number; output_tokens?: number } }>(openAiUrl("responses"), {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-5.6-luna",
      reasoning: { effort: "low" },
      max_output_tokens: 450,
      store: false,
      input: `You answer only from the supplied authorized sources. If the sources do not support the answer, say that clearly. Cite factual claims with source IDs in square brackets. Do not infer or mention documents that are not present in the authorized context.\n\nQuestion: ${question}\n\nAuthorized sources:\n${context}`,
    }),
  }, { attempts: 3, baseDelayMs: 250, maxDelayMs: 1400, timeoutMs: 20_000 });
}

export async function POST(request: NextRequest) {
  const started = Date.now();
  try {
    const payload = await request.json() as { question?: string; persona?: string };
    const question = payload.question?.trim() ?? "";
    const persona = payload.persona && PERSONAS[payload.persona] ? payload.persona : "employee";
    if (question.length < 3 || question.length > 500) return NextResponse.json({ error: "Question must be between 3 and 500 characters." }, { status: 400 });

    const groups = new Set(PERSONAS[persona]);
    const allowed = DOCS.filter((doc) => doc.groups.some((group) => groups.has(group)));
    const blockedCount = DOCS.length - allowed.length;
    const apiKey = process.env.OPENAI_API_KEY;
    const degradedReasons: string[] = [];
    let providerRetries = 0;

    const ranked = allowed
      .map((doc) => ({ doc, score: hybridScore(question, doc) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const retrievalMode = "authorization-first hybrid retrieval";
    const strong = ranked.filter((item) => item.score >= 0.12);

    if (strong.length === 0) {
      return NextResponse.json({
        answer: "I do not have an authorized source that supports an answer to that question for this identity.",
        sources: [],
        trace: [
          ["Resolve identity", `Persona=${persona}; groups=${[...groups].join(", ")}`],
          ["Apply access filter", `${allowed.length} documents searchable; ${blockedCount} unavailable to this identity`],
          ["Retrieve", "No sufficiently relevant authorized source found"],
          ["Answer guard", "Stopped before generation rather than guessing"],
        ],
        metrics: { retrievalMode, blockedCount, providerRetries, degraded: false, degradedReasons, latencyMs: Date.now() - started, model: "not called" },
      }, { headers: { "Cache-Control": "no-store" } });
    }

    let answer = strong.map(({ doc }) => `${doc.title}: ${doc.content}`).join("\n");
    let model = "deterministic evidence response";
    let inputTokens = 0;
    let outputTokens = 0;

    if (apiKey) {
      try {
        const generated = await answerWithModel(question, strong, apiKey);
        providerRetries += generated.retries;
        const text = responseText(generated.data).trim();
        if (text) {
          answer = text;
          model = "gpt-5.6-luna";
        } else {
          degradedReasons.push("The answer model returned no usable text; retrieved authorized evidence was returned directly.");
        }
        inputTokens = generated.data.usage?.input_tokens ?? 0;
        outputTokens = generated.data.usage?.output_tokens ?? 0;
      } catch {
        degradedReasons.push("Answer generation was temporarily unavailable; retrieved authorized evidence was returned directly without weakening the access boundary.");
      }
    } else {
      degradedReasons.push("Live answer generation is not configured; retrieved authorized evidence was returned directly.");
    }

    return NextResponse.json({
      answer,
      sources: strong.map(({ doc, score }) => ({ id: doc.id, title: doc.title, owner: doc.owner, score: Number(score.toFixed(3)) })),
      trace: [
        ["Resolve identity", `Persona=${persona}; groups=${[...groups].join(", ")}`],
        ["Apply access filter", `${allowed.length} documents searchable; ${blockedCount} unavailable to this identity`],
        ["Retrieve", `${strong.length} authorized sources selected with ${retrievalMode}`],
        ["Generate", model === "gpt-5.6-luna" ? "Generated a grounded answer from authorized context only" : "Returned retrieved evidence without model-generated claims"],
        ["Cite", `${strong.length} source records returned with the answer`],
      ],
      metrics: {
        retrievalMode,
        blockedCount,
        providerRetries,
        degraded: degradedReasons.length > 0,
        degradedReasons,
        latencyMs: Date.now() - started,
        model,
        inputTokens,
        outputTokens,
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "The knowledge workflow could not parse this request." }, { status: 400 });
  }
}
