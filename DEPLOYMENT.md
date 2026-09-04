# Deployment guide

## Recommended public deployment: Vercel

The website has no required secrets and works in deterministic demo mode.

1. In Vercel, choose **Add New → Project** and import `hkaur2001/harpreet_portfolio`.
2. Keep the detected Next.js settings.
3. Deploy.
4. Vercel's production URL is detected automatically for metadata and sitemap generation.

If you connect a custom domain, set:

```text
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

Recommended production domain:
- `harpreetkaur.dev`
- `harpreet.build`
- `kaur.ai` if available

## Optional Python runtime

The FastAPI service is not required for the public web demos. It exists as an inspectable backend reference.

For a hosted version, deploy `services/agent-runtime` to a container-friendly service and expose its URL through an environment variable in a future adapter.

## Production checklist

- Verify the production metadata, sitemap, and generated Open Graph card after the site is live.
- Add a real recorded demo link when available.
- Add analytics only if you want it; avoid invasive tracking.
- Keep synthetic data as the default demo path.
- Never commit employer data, credentials, internal URLs, or proprietary documents.
