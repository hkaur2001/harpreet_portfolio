# Security policy

## Scope

This repository is a public portfolio and demonstration environment. It must not contain employer data, customer information, private source material, credentials, tokens, internal URLs, or production infrastructure secrets.

## Reporting a vulnerability

Report suspected vulnerabilities privately to harpreetkaur622@gmail.com with the affected route, impact, and a minimal reproduction. Do not include secrets or personal information in a public GitHub issue, and do not test using real customer or third-party data.

## Implemented baseline

- Server-only provider credentials; public health responses expose configuration state, never secret values.
- Repository secret scanning and dependency audit in release validation.
- CSP, anti-framing, MIME-sniffing protection, strict referrer policy, restricted browser permissions, and HSTS.
- JSON content-type, request-size, schema, and rate boundaries on public mutation and model routes.
- No arbitrary shell, SQL, file-system, or production-infrastructure tools exposed to models.
- Deterministic identity, authorization, policy, approval, and release gates outside model control.
- Synthetic public datasets and explicit labeling of simulations and reference architecture.

## Data handling by project

| Project | Data used | Persistence | Primary security boundary |
| --- | --- | --- | --- |
| Atlas | Synthetic industry evidence and submitted workflow brief | Request only | Model-selected read-only tools; validated arguments, budgets, evidence references, and no external writes |
| FieldGuide | Public scenarios or submitted workflow text | None intended | Per-action authorization and eval-gated rollout |
| Sentinel | Synthetic incident evidence | None | Allowlisted tools, policy-as-code, and approval; remediation is simulated |
| Secure Knowledge | Synthetic documents and personas | None | ACL filtering occurs before retrieval and generation |
| Voiceprint | User-pasted writing samples | Request only | Input limits, no server persistence, deterministic copy guard |
| SignalBrief | User goal/topics and public web sources | Request only | Public-source provenance and no-fabrication fallback |
| Policy Radar | Public Federal Register records | Server cache only | Primary-source provenance and visible upstream failure |
| Enough | Plan, RSVP, optional email/name | Database when configured; browser fallback otherwise | Hashed capability tokens, atomic quorum, RLS reference design |

## Important limitations

The in-memory public API limiter is a best-effort abuse control per server instance, not a substitute for a distributed edge rate limiter. Production customer deployments also require tenant-specific SSO, centralized audit retention, managed key rotation, data-processing agreements, incident response, backup/restore testing, and infrastructure controls that cannot be demonstrated safely in a public portfolio.

Voiceprint loads an exact-version Transformers.js module and public model assets from third-party CDNs in the browser. The CSP restricts those origins, but an enterprise deployment should self-host reviewed artifacts and verify them in the software-supply-chain process.
