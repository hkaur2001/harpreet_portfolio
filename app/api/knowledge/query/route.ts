import { NextRequest, NextResponse } from "next/server";

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

function cosine(a: number[], b: number[]) {
  let dot = 0;
  let a2 = 0;
  let b2 = 0;
  const length = Math.min(a.length, b.length);
  for (let i = 0; i < length; i += 1) {
    dot += a[i] * b[i];
    a2 += a[i] * a[i];
    b2 += b[i] * b[i];
  }
  return dot / (Math.sqrt(a2) * Math.sqrt(b2) || 1);
}

function tokenize(text: string) {
  return new Set(text.toLowerCase().match(/[a-z0-9]+/g) ?? []);
}

function lexicalScore(question: string, doc: KnowledgeDoc) {
  const q = tokenize(question);
  const d = tokenize(`${doc.title} ${doc.content} ${doc.owner}`);
  let overlap = 0;
  q.forEach((token) => { if (d.has(token)) overlap += 1; });
  return overlap / Math.max(1, q.size);
}

async function embed(input: string[], apiKey: string) {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "text-embedding-3-small", input }),
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`Embedding request failed (${response.status}).`);
  const body = await response.json() as { data?: Array<{ embedding?: number[] }>; usage?: { total_tokens?: number } };
  const vectors = body.data?.map((item) => item.embedding ?? []) ?? [];
  if (vectors.length !== input.length) throw new Error("Embedding response was incomplete.");
  return { vectors, tokens: body.usage?.total_tokens ?? 0 };
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
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-5.6-luna",
      reasoning: { effort: "low" },
      max_output_tokens: 450,
      input: `You answer only from the supplied authorized sources. If the sources do not support the answer, say that clearly. Cite factual claims with source IDs in square brackets. Do not infer or mention documents that are not present in the authorized context.\n\nQuestion: ${question}\n\nAuthorized sources:\n${context}`,
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`Answer request failed (${response.status}).`);
  const body = await response.json() as { usage?: { input_tokens?: number; output_tokens?: number } };
  return { text: responseText(body), usage: body.usage ?? {} };
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

    let ranked: Array<{ doc: KnowledgeDoc; score: number }>;
    let retrievalMode = "lexical fallback";
    let embeddingTokens = 0;

    if (apiKey) {
      try {
        const inputs = [question, ...allowed.map((doc) => `${doc.title}\n${doc.content}`)];
        const embedded = await embed(inputs, apiKey);
        const [queryVector, ...docVectors] = embedded.vectors;
        embeddingTokens = embedded.tokens;
        ranked = allowed.map((doc, index) => ({ doc, score: cosine(queryVector, docVectors[index]) })).sort((a, b) => b.score - a.score).slice(0, 3);
        retrievalMode = "OpenAI embeddings";
      } catch {
        ranked = allowed.map((doc) => ({ doc, score: lexicalScore(question, doc) })).sort((a, b) => b.score - a.score).slice(0, 3);
      }
    } else {
      ranked = allowed.map((doc) => ({ doc, score: lexicalScore(question, doc) })).sort((a, b) => b.score - a.score).slice(0, 3);
    }

    const strong = ranked.filter((item) => item.score >= (retrievalMode === "OpenAI embeddings" ? 0.22 : 0.08));
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
        metrics: { retrievalMode, embeddingTokens, blockedCount, latencyMs: Date.now() - started, model: "not called" },
      });
    }

    let answer = strong.map(({ doc }) => `${doc.title}: ${doc.content}`).join("\n");
    let model = "deterministic fallback";
    let inputTokens = 0;
    let outputTokens = 0;
    if (apiKey) {
      try {
        const generated = await answerWithModel(question, strong, apiKey);
        if (generated.text) answer = generated.text;
        model = "gpt-5.6-luna";
        inputTokens = generated.usage.input_tokens ?? 0;
        outputTokens = generated.usage.output_tokens ?? 0;
      } catch {
        // The retrieval result remains usable even if generation is temporarily unavailable.
      }
    }

    return NextResponse.json({
      answer,
      sources: strong.map(({ doc, score }) => ({ id: doc.id, title: doc.title, owner: doc.owner, score: Number(score.toFixed(3)) })),
      trace: [
        ["Resolve identity", `Persona=${persona}; groups=${[...groups].join(", ")}`],
        ["Apply access filter", `${allowed.length} documents searchable; ${blockedCount} unavailable to this identity`],
        ["Retrieve", `${strong.length} authorized sources selected with ${retrievalMode}`],
        ["Generate", model === "deterministic fallback" ? "Returned retrieved evidence without a model call" : "Generated a grounded answer from authorized context only"],
        ["Cite", `${strong.length} source records returned with the answer`],
      ],
      metrics: { retrievalMode, embeddingTokens, blockedCount, latencyMs: Date.now() - started, model, inputTokens, outputTokens },
    });
  } catch {
    return NextResponse.json({ error: "The knowledge workflow could not complete this request." }, { status: 500 });
  }
}
