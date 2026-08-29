# Micro-Embassy

**Ephemeral trust infrastructure for travelers who lose their documents abroad.**

Micro-Embassy activates after a crisis. It turns scattered synthetic evidence into a temporary emergency case and gives police, hotels, airlines, and consulates different minimum-disclosure views. Every link expires, can be revoked, and belongs to a case designed to be destroyed when the incident is resolved.

## Product boundaries

Micro-Embassy is not a travel planner, itinerary assistant, permanent digital wallet, or government identity provider. The hackathon MVP demonstrates post-incident recovery, purpose-bound disclosure, expiration, revocation, and an auditable case lifecycle.

## Current vertical slice

- Synthetic lost-passport case in Barcelona
- Police, consulate, airline, and hotel recipient views
- Different allowlisted and protected fields per role
- Interactive revoke and 30-minute reissue controls
- Explicit case-destruction lifecycle
- No real identity data or external credentials

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quality gates

```bash
npm run lint
npm run build
```

Playwright coverage will validate the role-switching, revocation, reissue, and mobile flows.

## Planned integrations

The architecture is prepared for server-side document extraction and redaction, official-source discovery, PDF assembly, e-signature, and temporary DNS. Integrations will only be listed as complete after they run in the demo with real API calls.

## Safety

All documents and identities in the demo are synthetic. Never commit `.env` files, API credentials, real passport scans, or live emergency-case data.
