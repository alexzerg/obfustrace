# Micro-Embassy

**Ephemeral trust infrastructure for travelers who lose their documents abroad.**

Micro-Embassy activates after a crisis. It turns scattered synthetic evidence into a temporary emergency case and gives police, hotels, airlines, and consulates different minimum-disclosure views. Every link expires, can be revoked, and belongs to a case designed to be destroyed when the incident is resolved.

**Live demo:** [micro-embassy.vercel.app](https://micro-embassy.vercel.app)

## Product boundaries

Micro-Embassy is not a travel planner, itinerary assistant, permanent digital wallet, or government identity provider. The hackathon MVP demonstrates post-incident recovery, purpose-bound disclosure, expiration, revocation, and an auditable case lifecycle.

## Current vertical slice

- Synthetic lost-passport case in Barcelona
- Police, consulate, airline, and hotel recipient views
- Different allowlisted and protected fields per role
- Interactive revoke and 30-minute reissue controls
- Explicit case-destruction lifecycle
- Server-only Nutrient DWS extraction boundary
- Downloadable synthetic travel-evidence sample
- No real identity data or committed credentials

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Real extraction requires a private `NUTRIENT_DWS_API_KEY`; without it, the UI remains honest and reports that the provider is not configured.

## Quality gates

```bash
npm run lint
npm run build
npm run test:e2e
```

Playwright covers provider readiness, upload error handling, role switching, revocation, reissue, and desktop/mobile layouts.

## Nutrient DWS

`POST /api/documents/extract` validates a temporary upload and forwards it to Nutrient DWS using a server-only Bearer key. The app requests deterministic JSON content with key-value pairs, plain text, and structured text. Without the key, the route returns `NUTRIENT_NOT_CONFIGURED`; it never substitutes synthetic output for a sponsor response.

See [`docs/integrations/nutrient-dws.md`](docs/integrations/nutrient-dws.md) for the contract and setup.

## Planned integrations

Document redaction, human review, PDF assembly, e-signature, and persistent expiring links remain planned. Integrations will only be listed as complete after they run in the demo with real API calls.

## Safety

All documents and identities in the demo are synthetic. Never commit `.env` files, API credentials, real passport scans, or live emergency-case data.
