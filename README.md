# Harpreet Kaur — Software Engineering, Applied AI & Forward Deployed Systems

This repository is a public proof-of-work portfolio: production-style applications, system design, interactive AI workflows, evaluation, security boundaries, data integrations, and deployable code.

**Live portfolio:** https://harpreet-portfolio-tau.vercel.app

## Flagship: Sentinel

**Sentinel** is an AI production incident-response platform. A visitor can inject a simulated incident and watch the system investigate it across metrics, logs, deployments, database diagnostics, service health, source changes, runbooks, and prior incidents.

The interesting part is the control architecture:

```text
incident
   ↓
Investigation Agent
   ↓
read-only Tool Gateway ──→ logs / metrics / deploys / DB / runbooks / source changes
   ↓
evidence-backed diagnosis
   ↓
deterministic Policy Engine
   ├── allowed → simulated execution
   ├── approval → human decision → simulated execution
   └── denied
   ↓
recovery verification + postmortem
```

### Sentinel demonstrates

- OpenAI Responses API function/tool calling
- adaptive model → tool → observation loops
- model routing and per-run token/cost telemetry
- bounded tool schemas and connector contracts
- MCP exposure of the same read-only tool surface
- deterministic authorization/risk policy
- human approval for production-impacting actions
- prompt-injection labeling for untrusted logs/tool output
- evidence IDs and alternative hypotheses
- reproducible failure injection
- deterministic safety/evaluation suite
- FastAPI + OpenAPI reference backend
- PostgreSQL + pgvector persistence schema
- Docker Compose local platform
- Terraform AWS deployment reference
- GitHub Actions CI

Public remediation changes **simulated infrastructure only**. The model never receives direct production credentials or arbitrary shell/SQL access.

See [`sentinel/`](./sentinel) for the deeper backend, MCP, database, simulator, infrastructure, tests, and architecture decisions.

## Other builds

### AI Policy Radar
A live-data product using the Federal Register API. It demonstrates server-side external API integration, caching, normalization, provenance, and upstream failure handling without forcing an LLM into a problem that does not need one.

### Agent Systems Lab
Focused server-executed workflows for permission-aware retrieval, technical discovery/architecture, and AI reliability behavior. They expose tools, evidence, decisions, and metrics rather than hiding behavior behind a chat interface.

### ContextOps
A permission-aware retrieval proof focused on authorization before generation, metadata filtering, source grounding, and run-level evaluation.

## Professional context

I build enterprise AI and data systems at **S&P Global**. My production work has included patterns spanning 8+ enterprise integrations, more than 500K knowledge assets, and systems designed for an organization of 40K+ users.

No proprietary employer data, credentials, internal URLs, or internal source code are used in these public projects.

## Web stack

- Next.js 16.3
- React 19.2
- TypeScript
- Tailwind CSS 4.3
- OpenAI SDK (server-side only)
- Vercel

Run locally:

```bash
npm install
npm run dev
```

Optional live Sentinel reasoning:

```bash
export OPENAI_API_KEY="..."
```

Never expose the provider key through a `NEXT_PUBLIC_` environment variable.

## Sentinel reference backend

```bash
cd sentinel/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest -q
uvicorn app.main:app --reload
```

Open `http://localhost:8000/docs` for the API surface.

To start the local Postgres/pgvector + Redis + API platform from the repository root:

```bash
docker compose -f sentinel/docker-compose.yml up --build
```

## CI

GitHub Actions independently validates:
- TypeScript typecheck
- Next.js production build
- existing Python agent runtime tests
- Sentinel Python backend safety/policy tests

## Public-data and secret policy

Do not commit:
- S&P Global proprietary data or source code
- customer information
- internal URLs/screenshots
- credentials, tokens, or `.env` files
- production infrastructure secrets

Synthetic operational data is used where a safe, reproducible environment is needed. Live public data is source-linked where used.

## Contact

**Harpreet Kaur** · New York, NY  
Harpreetkaur622@gmail.com  
LinkedIn: https://www.linkedin.com/in/harpreet-kaur-0501/  
GitHub: https://github.com/hkaur2001
