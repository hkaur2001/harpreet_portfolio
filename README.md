# Harpreet Kaur — Applied AI / Forward Deployed Engineering Portfolio

A production-style portfolio built to show how I approach AI systems in the real world: agents, RAG, enterprise integrations, evaluation, governance, observability, and measurable workflow value.

## Positioning

> **I build AI systems that survive contact with the enterprise.**

I currently build enterprise AI systems at **S&P Global**, with experience spanning 8+ enterprise integrations, 500K+ knowledge assets, and systems serving an organization of 40K+ users.

This repository is intentionally not a resume mirror. It is a proof artifact: architecture, tradeoffs, interactive demos, evaluation thinking, and code.

## What is inside

### Public portfolio
- Next.js 16.3 / React 19.2
- TypeScript
- Tailwind CSS 4.3
- Responsive, dark/light adaptive design
- Detailed flagship case study
- Interactive subscription-free agent demos

### Agent labs
1. **ContextOps** — permission-aware RAG + MCP-style tools + evals
2. **Solution Architect Agent** — customer discovery + architecture + ROI hypothesis
3. **Incident Commander** — AI production incident triage + safe reversible actions

All demos run without paid APIs. Synthetic enterprise data is used by default so the repository is safe to inspect publicly and never depends on employer systems.

### Python reference runtime
`services/agent-runtime` contains a small FastAPI implementation of:
- permission pre-filtering
- retrieval
- typed tool traces
- citations
- latency / cost metrics
- safety regression tests

## Run the website

Requirements:
- Node.js 22+
- npm

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Run the Python agent runtime

```bash
cd services/agent-runtime
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Then open `http://localhost:8000/docs`.

Example request:

```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"question":"Can everyone access the Q3 pricing playbook?","groups":["everyone"]}'
```

## Evaluation philosophy

The flagship system treats the following as separate release gates:
- context relevance
- groundedness
- answer relevance
- permission compliance
- citation coverage
- tool correctness
- latency and cost

The synthetic demo does not fabricate financial ROI. A real pilot should baseline the workflow first and calculate value from observed adoption and time saved.

## Deployment

### Vercel
1. Import this repository into Vercel.
2. Framework preset: Next.js.
3. No environment variables are required for deterministic demo mode.
4. Deploy.

### Other providers
Any Node-compatible platform that supports Next.js can host the web app. The FastAPI runtime can be containerized separately if you want the portfolio to call the Python service instead of the built-in deterministic UI simulation.

## Public-data policy

Do not commit:
- confidential S&P Global source data
- internal URLs
- credentials / tokens
- proprietary documents
- customer information
- internal screenshots containing sensitive data

The project architecture is inspired by production engineering constraints, but all demo content is synthetic.

## Contact

**Harpreet Kaur** · New York, NY  
harpreetkaur622@gmail.com  
LinkedIn: https://www.linkedin.com/in/harpreet-kaur-0501/  
GitHub: https://github.com/hkaur2001
