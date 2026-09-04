# Harpreet Kaur — Software Engineering, Applied AI & Production Systems

This repository is my public engineering portfolio: a small set of working products that show how I approach ambiguous problems from product design through backend implementation, AI behavior, security, evaluation, reliability, and deployment.

**Live portfolio:** https://harpreet-portfolio-tau.vercel.app

## Selected projects

### Sentinel — AI production incident response

When a production service breaks, the symptom is often obvious before the cause is. Sentinel investigates a simulated incident across metrics, logs, deployments, database diagnostics, service health, source changes, runbooks, and prior incidents.

The model can gather evidence and recommend an action. It cannot authorize itself to change production.

Sentinel includes OpenAI Responses API tool calling, adaptive model → tool → observation loops, MCP, model routing, token/cost telemetry, deterministic authorization policy, human approval, prompt-injection handling, evidence IDs, reproducible incident simulation, FastAPI/Pydantic, PostgreSQL + pgvector, Redis, Docker Compose, Kubernetes/Terraform reference infrastructure, and automated evaluation/security tests.

Public remediation modifies **simulated infrastructure only**. No real production credentials or arbitrary shell/SQL access are exposed.

See [`sentinel/`](./sentinel) for the backend, MCP server, persistence schema, simulator, infrastructure, tests, and design notes.

### Secure Knowledge Assistant — permission-aware RAG

A knowledge assistant should not retrieve every document it can find. This project resolves a user identity first, removes inaccessible documents, runs semantic retrieval only over authorized knowledge, and then asks a language model to answer from that evidence.

The live path uses server-side ACL filtering, semantic retrieval, grounded generation, citations, visible execution traces, and deterministic fallback behavior. The repository also includes PostgreSQL/pgvector production reference patterns.

### Voiceprint Studio — personalized content voice agent

A personalization workflow that learns recurring writing patterns from prior posts, retrieves relevant examples, drafts fresh content in that style, checks for copied phrasing, scores style fidelity/brief adherence/platform fit/originality, and performs one targeted revision when the quality gate is missed.

Voiceprint deliberately uses more than one AI execution pattern:

- **Browser-local embeddings:** Hugging Face Transformers.js runs `Xenova/bge-small-en-v1.5` on-device, removing the remote embedding API from the request path.
- **Hosted generation:** OpenAI is the primary generator; the repository includes Hugging Face Inference Provider fallback routing for open models.
- **Independent evaluation:** when `HF_TOKEN` is configured, a Hugging Face-hosted model can grade an OpenAI-generated draft, reducing same-model-family evaluator bias.
- **Deterministic safety:** code checks exact phrase overlap regardless of what an LLM judge says.

The public demo processes pasted examples ephemerally and does not persist them.

### SignalBrief — multi-source research agent

A goal-aware research workflow that uses live web search to look across public Reddit discussions, newsletter/blog analysis, public LinkedIn posts when indexable, and primary technical sources. It synthesizes useful signals into a professional-goal-specific digest, returns source links, reports source-coverage gaps, and evaluates the result for relevance, synthesis, actionability, diversity, and citation coverage.

When Hugging Face hosted inference is configured, SignalBrief uses an independent open-model judge before falling back to its primary model provider. It does not scrape authenticated LinkedIn pages; a production connector would use an approved API/export/integration.

### AI Policy Radar — live public-data product

A focused Federal Register monitoring product for recent U.S. federal AI-related documents. It demonstrates external API integration, server rendering, caching, normalization, source provenance, and graceful upstream failure handling.

The core workflow intentionally does **not** use an LLM. The product problem is trustworthy monitoring and primary-source access, so model inference would create unnecessary cost and uncertainty.

## Evaluation framework

The repository includes [`evals/`](./evals), a representative golden dataset, deterministic CI gates, and project-specific model/human evaluation plans.

The methodology combines:

- **Deterministic checks** for security, policy, schemas, citation/source requirements, approval behavior, and copy-risk constraints.
- **LLM-as-judge** rubrics for semantic qualities such as groundedness, relevance, style fidelity, synthesis, and actionability.
- **Cross-model evaluation** where a different model/provider can grade generation output.
- **Human/product signals** for taste, blind preference, task completion, adoption, edit rate, and real-world usefulness.
- **Scenario slices** so aggregate averages cannot hide failures in permission-negative, prompt-injection, source-gap, or high-risk-action cases.
- **Release gates** so critical failures block shipping rather than being averaged away.

Run the deterministic evaluation gates with:

```bash
npm run evals:offline
```

## AI engineering surface

The selected projects collectively exercise the main application-layer concerns I want this portfolio to demonstrate:

- **Frontend:** React, TypeScript, Next.js, Tailwind CSS
- **Backend:** Python, FastAPI, Pydantic, Next.js server routes, REST APIs
- **Models:** OpenAI Responses API, Hugging Face Inference Providers, open-model routing, structured outputs, embeddings, web search
- **Local ML:** Hugging Face Transformers.js, ONNX Runtime, browser model caching
- **Agent systems:** bounded tools, MCP, human approval, explicit authority boundaries, revision loops
- **Retrieval:** RAG, cosine similarity, pgvector, metadata/ACL filtering, citations
- **Data:** PostgreSQL, Redis, external APIs, normalized contracts
- **Infrastructure:** Docker, Kubernetes reference manifests, Terraform, AWS patterns
- **Quality:** golden datasets, deterministic evals, LLM-as-judge, cross-model judges, pytest, regression tests, GitHub Actions
- **Operations:** observability, traces, latency/cost telemetry, retries, graceful fallback, failure handling
- **Security:** least privilege, ACL/RBAC patterns, prompt-injection defense, approval gates, privacy-conscious processing

Project pages distinguish between technology running in the public Vercel deployment, code implemented in the repository, and production reference architecture.

## Provider configuration

The application works with an OpenAI server-side key:

```bash
OPENAI_API_KEY=...
```

Voiceprint's semantic retrieval does **not** require that key because embeddings execute locally in the browser.

An optional Hugging Face fine-grained token with Inference Providers permission enables the hosted open-model route:

```bash
HF_TOKEN=...
```

`HF_TOKEN` is server-only. Never expose provider secrets through `NEXT_PUBLIC_*` environment variables or client bundles.

Safe provider configuration can be inspected through:

```text
/api/model-stack/health
```

The endpoint reports whether providers are configured and which public model IDs are wired; it never returns secret values.

## Run the web portfolio

Requirements:

- Node.js 24+
- npm

```bash
npm install
npm run dev
```

## Run the Sentinel backend

```bash
cd sentinel/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m pytest -q
uvicorn app.main:app --reload
```

Open `http://localhost:8000/docs` for the FastAPI/OpenAPI surface.

To start the local Postgres/pgvector + Redis + API platform from the repository root:

```bash
docker compose -f sentinel/docker-compose.yml up --build
```

## CI and stress testing

GitHub Actions validates:

- TypeScript type checking
- deterministic portfolio evaluation gates
- Next.js production build
- production HTTP stress/failure-injection suite
- provider `429` retry paths
- Voiceprint browser-local retrieval contract and lexical fallback
- Python runtime tests
- Sentinel backend compilation and imports
- MCP server import compatibility
- Sentinel policy/security tests
- local Docker Compose configuration

## Public-data and secret policy

Do not commit employer data, customer information, internal URLs/screenshots, credentials, tokens, `.env` files, or production infrastructure secrets.

Synthetic data is used where a safe and reproducible environment is required. Live public data remains linked to its primary source. User-provided content in Voiceprint Studio is processed for the request and is not persisted by the demo.

## Contact

**Harpreet Kaur** · New York, NY  
harpreetkaur622@gmail.com  
LinkedIn: https://www.linkedin.com/in/harpreet-kaur-0501/  
GitHub: https://github.com/hkaur2001
