# Deployment guide

## Recommended public deployment: Vercel

The website has no required secrets and works in deterministic demo mode.

1. Push the repository to GitHub.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Keep the detected Next.js settings.
4. Deploy.

Recommended production domain:
- `harpreetkaur.dev`
- `harpreet.build`
- `kaur.ai` if available

## Optional Python runtime

The FastAPI service is not required for the public web demos. It exists as an inspectable backend reference.

For a hosted version, deploy `services/agent-runtime` to a container-friendly service and expose its URL through an environment variable in a future adapter.

## Production checklist

- Replace metadata base domain in `app/layout.tsx` after choosing the final domain.
- Verify the generated Open Graph card after the production URL is live.
- Add a real recorded demo link.
- Add analytics only if you want it; avoid invasive tracking.
- Keep synthetic data as the default demo path.
