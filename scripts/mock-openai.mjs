import http from "node:http";

const counters = new Map();

function kindFor(path, body) {
  if (path.endsWith("/embeddings")) return "embeddings";
  const input = String(body?.input ?? "");
  if (input.includes("Analyze the recurring writing style")) return "voice-generate";
  if (input.includes("Grade the generated content")) return "voice-judge";
  if (input.includes("Act as a research agent")) return "research";
  if (input.includes("Evaluate a research digest")) return "research-judge";
  if (input.includes("You answer only from the supplied authorized sources")) return "knowledge-answer";
  if (input.includes("Revise the draft once")) return "voice-revision";
  return "responses";
}

function shouldRateLimit(kind) {
  const count = (counters.get(kind) ?? 0) + 1;
  counters.set(kind, count);
  return count === 1;
}

function vector(text, dims = 12) {
  const result = Array(dims).fill(0);
  for (let i = 0; i < text.length; i += 1) result[i % dims] += (text.charCodeAt(i) % 31) / 31;
  const norm = Math.sqrt(result.reduce((sum, value) => sum + value * value, 0)) || 1;
  return result.map((value) => value / norm);
}

function responseText(text) {
  return { output: [{ type: "message", content: [{ type: "output_text", text }] }], usage: { input_tokens: 120, output_tokens: 80 } };
}

function researchResponse() {
  return {
    output: [
      {
        type: "web_search_call",
        action: {
          sources: [
            { title: "Agent reliability discussion", url: "https://www.reddit.com/r/MachineLearning/comments/example" },
            { title: "Model evaluation guide", url: "https://openai.com/index/evals-drive-next-chapter-of-ai/" },
            { title: "Engineering newsletter", url: "https://example.substack.com/p/agent-evals" },
          ],
        },
      },
      {
        type: "message",
        content: [{
          type: "output_text",
          text: "Three signals worth knowing\n\n1. Production AI teams are treating evaluation as a release discipline, not a demo metric.\nWhy it matters: be ready to discuss golden sets, failure slices, and regression gates.\nAction: explain one eval you would block a release on.\n\n2. Tool boundaries and observability matter as much as model quality in agent systems.\nWhy it matters: interviews increasingly probe what the model is allowed to do and how failures are traced.\nAction: describe typed tools, approval gates, and traces.\n\n3. Retrieval quality should be measured separately from answer quality.\nWhy it matters: a fluent answer can hide a broken retriever.\nAction: distinguish context relevance from groundedness.\n\nSource coverage note: Reddit, newsletter/blog, and primary technical sources were represented; public LinkedIn coverage was not available in this fixture.",
        }],
      },
    ],
    usage: { input_tokens: 240, output_tokens: 260 },
  };
}

const server = http.createServer(async (req, res) => {
  if (req.method !== "POST") {
    res.writeHead(404).end();
    return;
  }
  let raw = "";
  for await (const chunk of req) raw += chunk;
  let body = {};
  try { body = JSON.parse(raw || "{}"); } catch {}
  const kind = kindFor(req.url || "", body);

  if (shouldRateLimit(kind)) {
    res.writeHead(429, { "Content-Type": "application/json", "Retry-After": "0" });
    res.end(JSON.stringify({ error: { type: "rate_limit_error", message: "Synthetic rate limit for resilience testing." } }));
    return;
  }

  let payload;
  if ((req.url || "").endsWith("/embeddings")) {
    const inputs = Array.isArray(body.input) ? body.input : [String(body.input ?? "")];
    payload = { data: inputs.map((text, index) => ({ index, embedding: vector(String(text)) })), usage: { total_tokens: inputs.length * 12 } };
  } else if (kind === "voice-generate") {
    payload = responseText(JSON.stringify({
      styleProfile: "Direct, reflective, first-person writing with short paragraphs, a concrete lesson, restrained punctuation, and a forward-looking close.",
      draft: "One year in, the biggest lesson is that progress rarely looks like one dramatic breakthrough.\n\nIt looks more like learning the system, asking better questions, shipping something useful, and then realizing how much more there is to improve.\n\nI am grateful for the people who made the year challenging in the right ways. The work changed how I think about building, ownership, and what production quality actually requires.\n\nOnward.",
    }));
  } else if (kind === "voice-judge") {
    payload = responseText(JSON.stringify({ styleFidelity: 4, briefAdherence: 5, platformFit: 4, originality: 5, copyRisk: "low", notes: "Matches the recurring structure without reusing distinctive phrases." }));
  } else if (kind === "voice-revision") {
    payload = responseText("One year in, I am less interested in milestones than in what changed because of the work.\n\nI learned to ask better questions, make failure visible, and treat production quality as part of the product rather than cleanup after launch.\n\nGrateful for the people who pushed the work forward. Onward.");
  } else if (kind === "research") {
    payload = researchResponse();
  } else if (kind === "research-judge") {
    payload = responseText(JSON.stringify({ relevance: 5, synthesis: 4, actionability: 5, sourceDiversity: 4, citationCoverage: 4, notes: "The brief is focused on the stated goal and converts signals into concrete preparation actions." }));
  } else if (kind === "knowledge-answer") {
    payload = responseText("Pricing exceptions require Revenue Enablement review and must follow approved escalation rules [pricing-playbook].");
  } else {
    payload = responseText("ok");
  }

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
});

server.listen(8787, "127.0.0.1", () => console.log("mock OpenAI provider listening on 8787"));
