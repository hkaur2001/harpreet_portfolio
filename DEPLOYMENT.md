# Deployment guide

## Public deployment: Vercel

The portfolio is deployed from `main` through Vercel's Git integration. The site remains functional in deterministic demo mode without provider secrets; Sentinel's live investigation mode additionally uses a server-side OpenAI API key.

1. Import `hkaur2001/harpreet_portfolio` into Vercel as a Next.js project.
2. Keep the repository root (`./`) as the Root Directory.
3. Keep the detected Next.js build/output settings.
4. Deploy from `main`.
5. Vercel's production URL is detected automatically for metadata and sitemap generation.

## Environment variables

### `OPENAI_API_KEY`

Required only for Sentinel's **Live OpenAI** investigation mode.

- Configure it in Vercel Project Settings → Environment Variables.
- Apply it to Production (and Preview only if you want live preview runs).
- Never prefix it with `NEXT_PUBLIC_`.
- Never commit the value or an `.env` file.

The public UI only receives a boolean indicating whether live mode is configured. The key itself remains on the server.

Because the live demo can incur provider charges, configure provider-side project budgets/alerts. The application also applies a bounded tool loop, max output tokens, deterministic fallback, and a best-effort public-request throttle.

### `NEXT_PUBLIC_SITE_URL`

Optional. Set this after connecting a custom domain:

```text
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## Sentinel deployment shape

The recruiter-facing product runs inside the Next.js/Vercel deployment:

- UI: `/projects/sentinel`
- Investigation API: `/api/sentinel/investigate`
- Remediation/policy API: `/api/sentinel/remediate`
- Safety eval summary: `/api/sentinel/evals`
- Runtime health/config: `/api/sentinel/health`

The public remediation target is synthetic infrastructure only.

The deeper `sentinel/` directory is a production architecture reference containing FastAPI, an MCP tool server, PostgreSQL/pgvector schema, Docker Compose, connector contracts, tests, and Terraform. It does not need to be deployed for the public Vercel demo to work.

## Optional standalone Sentinel backend

```bash
cd sentinel/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m pytest -q
uvicorn app.main:app --reload
```

Or from the repository root:

```bash
docker compose -f sentinel/docker-compose.yml up --build
```

## Production checklist

- Verify GitHub Actions is green for web, existing Python runtime, and Sentinel backend jobs.
- Verify Vercel reports the production deployment as Ready.
- Open `/api/sentinel/health` and confirm `liveModelConfigured: true` when live mode is intended.
- Run one Sentinel incident in Live OpenAI mode and confirm the result reports `mode: live`; deterministic fallback is intentionally visible if provider execution fails.
- Test the approval-required rollback scenario and the ambiguous/prompt-injection scenario.
- Verify the generated Open Graph card, sitemap, and robots output.
- Keep synthetic infrastructure data as the public incident path.
- Never commit employer data, credentials, internal URLs, proprietary documents, or production infrastructure secrets.
