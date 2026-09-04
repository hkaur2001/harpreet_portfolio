# Sentinel — AI Production Incident Response Platform

Sentinel is a production-oriented incident-response platform that investigates simulated production incidents across logs, metrics, deployments, database diagnostics, service health, and operational knowledge. It builds evidence-backed hypotheses, recommends bounded remediation, routes risky actions through deterministic policy, and records an inspectable trace for every run.

The public product is deployed as part of Harpreet Kaur's portfolio at `/projects/sentinel`. This directory contains the deeper backend and infrastructure reference implementation used to discuss the system beyond the UI.

## Design goals

- **Adaptive investigation:** one primary Investigation Agent selects read-only tools based on intermediate evidence rather than following a fixed chatbot script.
- **Bounded authority:** the model cannot directly restart, scale, roll back, mutate a database, or change permissions.
- **Deterministic governance:** a policy engine owns permissions, risk classification, and human-approval requirements.
- **Evidence grounding:** diagnoses cite concrete metrics, logs, deployment changes, database diagnostics, and runbooks.
- **Prompt-injection resistance:** logs and external tool output are explicitly classified as untrusted observations.
- **Reproducibility:** a demo cloud supplies deterministic failure scenarios so regressions can be evaluated repeatedly.
- **Observability:** tool calls, evidence, latency, tokens, estimated cost, policy decisions, and state transitions are first-class data.

## Repository map

```text
sentinel/
├── backend/
│   ├── app/
│   │   ├── connectors.py       # connector contracts + simulated adapters
│   │   ├── evaluation.py       # repeatable safety/eval harness
│   │   ├── main.py             # FastAPI surface
│   │   ├── mcp_server.py       # MCP exposure of bounded tools
│   │   ├── policy.py           # deterministic action policy
│   │   ├── security.py         # untrusted-content defenses
│   │   └── tools.py            # tool gateway + audit-friendly specs
│   ├── db/schema.sql           # PostgreSQL + pgvector production schema
│   └── tests/
├── simulator/scenarios.json    # failure-injection catalog
├── infrastructure/terraform/   # AWS deployment reference
├── docs/                       # architecture, security, evals, decisions
└── docker-compose.yml          # local Postgres/pgvector + Redis + API
```

## Run the reference backend

```bash
cd sentinel/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open `http://localhost:8000/docs` for the OpenAPI surface.

The reference backend does not require an OpenAI key for policy, connector, simulator, and evaluation tests. A provider key is only needed when wiring a model-driven investigator into this standalone service.

## Run tests

```bash
cd sentinel/backend
pytest -q
```

The root GitHub Actions workflow runs these tests independently from the Next.js build.

## MCP server

The same bounded read tools are exposed through an MCP server so an MCP-capable client can use the connector layer without receiving arbitrary infrastructure access.

```bash
cd sentinel/backend
python -m app.mcp_server
```

The MCP process exposes read-only operational tools. Remediation intentionally stays outside the MCP investigation surface and must go through the policy/approval path.

## Local platform services

```bash
docker compose -f sentinel/docker-compose.yml up --build
```

This starts:
- PostgreSQL with pgvector
- Redis
- Sentinel FastAPI reference service

The public Vercel demo does **not** require these services; it uses in-repo simulator fixtures so a recruiter can run the product without an account or infrastructure setup.

## What is simulated vs real

**Real implementation paths:** model tool orchestration in the web runtime, tool schemas, connector contracts, policy evaluation, approval gating, evidence handling, prompt-injection labeling, traces, eval code, API routes, CI, and deployment.

**Simulated:** production services, operational telemetry, deployments, database state, and remediation. No public visitor can affect real infrastructure.

## Production evolution

A real organization would replace simulator connectors with adapters for its observability, deployment, source-control, database, ticketing, and knowledge systems. The connector boundary is intentionally narrow so those integrations can be swapped without giving the model new authority.
