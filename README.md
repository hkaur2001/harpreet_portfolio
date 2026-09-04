# Harpreet Kaur — Software Engineering, Applied AI & Production Systems

This repository is my public engineering portfolio: a small set of working products that show how I approach ambiguous problems from product design through backend implementation, AI behavior, security, evaluation, reliability, and deployment.

**Live portfolio:** https://harpreet-portfolio-tau.vercel.app

## Selected projects

### Sentinel — AI production incident response

When a production service breaks, the symptom is often obvious before the cause is. Sentinel investigates a simulated incident across metrics, logs, deployments, database diagnostics, service health, source changes, runbooks, and prior incidents.

The model can gather evidence and recommend an action. It cannot authorize itself to change production.

```text
incident
   ↓
Investigation Agent
   ↓
bounded read-only tools
   ↓
evidence + hypotheses
   ↓
root-cause diagnosis
   ↓
deterministic Policy Engine
   ├── allow
   ├── require human approval
   └── deny
   ↓
simulated remediation
   ↓
recovery verification + postmortem
```

Sentinel includes:

- OpenAI Responses API tool calling
- adaptive model → tool → observation loops
- model routing and token/cost telemetry
- bounded tool schemas
- an MCP SDK v2 server for the read-only investigation surface
- deterministic authorization/risk policy
- human approval for high-risk actions
- prompt-injection handling for untrusted logs and tool output
- evidence IDs and alternative hypotheses
- reproducible incident simulation
- FastAPI + Pydantic reference backend
- PostgreSQL + pgvector schema
- Redis and Docker Compose local platform
- Terraform AWS reference infrastructure
- evaluation and security tests
- GitHub Actions CI

Public remediation modifies **simulated infrastructure only**. No real production credentials or arbitrary shell/SQL access are exposed.

See [`sentinel/`](./sentinel) for the backend, MCP server, persistence schema, simulator, infrastructure, tests, and design notes.

### Secure Knowledge Assistant — permission-aware RAG

A knowledge assistant should not retrieve every document it can find. This project resolves a user identity first, removes inaccessible documents, runs semantic retrieval only over authorized knowledge, and then asks a language model to answer from that evidence.

The live path uses:

- `text-embedding-3-small`
- GPT-5.6 Luna for grounded answer generation
- server-side ACL filtering
- vector similarity retrieval
- citations and visible execution traces
- deterministic fallback behavior when a provider call fails

The deeper architecture maps the same boundary to FastAPI, PostgreSQL/pgvector, MCP connector patterns, Redis caching, containerized services, and production identity systems.

### AI Policy Radar — live public-data product

A focused Federal Register monitoring product for recent U.S. federal AI-related documents. It demonstrates external API integration, server rendering, caching, normalization, source provenance, and graceful upstream failure handling.

The core workflow intentionally does **not** use an LLM. The product problem is trustworthy monitoring and primary-source access, so adding model inference would create unnecessary cost and uncertainty.

## AI engineering surface

The selected projects collectively exercise the main application-layer concerns I want this portfolio to demonstrate:

- **Frontend:** React, TypeScript, Next.js, Tailwind CSS
- **Backend:** Python, FastAPI, Pydantic, Next.js server routes, REST APIs
- **Models:** OpenAI Responses API, tool calling, structured outputs, model routing, embeddings
- **Agent systems:** bounded tools, MCP, human approval, explicit authority boundaries
- **Retrieval:** RAG, vector similarity, pgvector, metadata/ACL filtering, citations
- **Data:** PostgreSQL, Redis, external APIs, normalized contracts
- **Infrastructure:** Docker, Kubernetes reference manifests, Terraform, AWS patterns
- **Quality:** eval harnesses, pytest, regression tests, GitHub Actions
- **Operations:** observability, traces, latency/cost telemetry, failure handling
- **Security:** least privilege, ACL/RBAC patterns, prompt-injection defense, approval gates

Project pages distinguish between technology running in the public Vercel deployment, code implemented in the repository, and production reference architecture.

## Professional context

I build enterprise AI and data systems at **S&P Global**. My production work has included integration patterns spanning 8+ enterprise systems, more than 500K knowledge assets, and systems designed for an organization of 40K+ users.

No proprietary employer data, credentials, internal URLs, or internal source code are used in these public projects.

## Run the web portfolio

Requirements:

- Node.js 24+
- npm

```bash
npm install
npm run dev
```

The live AI paths use a server-side environment variable:

```bash
OPENAI_API_KEY=...
```

Never expose the provider key through a `NEXT_PUBLIC_` variable.

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

## CI

GitHub Actions validates:

- TypeScript type checking
- Next.js production build
- Python runtime tests
- Sentinel backend compilation and imports
- MCP server import compatibility
- Sentinel policy/security tests
- local Docker Compose configuration

## Public-data and secret policy

Do not commit employer data, customer information, internal URLs/screenshots, credentials, tokens, `.env` files, or production infrastructure secrets.

Synthetic data is used where a safe and reproducible environment is required. Live public data remains linked to its primary source.

## Contact

**Harpreet Kaur** · New York, NY  
harpreetkaur622@gmail.com  
LinkedIn: https://www.linkedin.com/in/harpreet-kaur-0501/  
GitHub: https://github.com/hkaur2001
