# Micro-Embassy

**Ephemeral trust infrastructure for travelers who lose their documents abroad.**

Micro-Embassy activates after a crisis. It turns scattered synthetic evidence into a temporary emergency case and gives police, hotels, airlines, and consulates different minimum-disclosure views. Every link expires, can be revoked, and belongs to a case designed to be destroyed when the incident is resolved.

**Live demo:** [micro-embassy.vercel.app](https://micro-embassy.vercel.app)

## Product boundaries

Micro-Embassy is not a travel planner, itinerary assistant, permanent digital wallet, or government identity provider. The hackathon MVP demonstrates post-incident recovery, purpose-bound disclosure, expiration, revocation, and an auditable case lifecycle.

## Current vertical slice

- Empty-state guided workflow instead of a preloaded case
- Visible file selection, validation, size, and MIME feedback
- PDF, DOC, DOCX, JPEG, PNG, TIFF, and WebP extraction support
- Synthetic lost-passport case revealed only after explicit preview or completed package creation
- Police, consulate, airline, and hotel recipient views
- Different allowlisted and protected fields per role
- Interactive revoke and 30-minute reissue controls
- Explicit case-destruction lifecycle
- Free private browser OCR for image-only PDFs and photographs
- Local PDF rendering through PDF.js and OCR through Tesseract.js
- Optional server-only Nutrient DWS extraction boundary
- Per-field confidence, source provenance, and deterministic review reasons
- Editable human confirmation before disclosure
- Multi-document evidence collection with per-source field provenance
- Identity correlation and conflict blocking before case creation
- Dynamic case dashboard and recipient views built from reviewed evidence
- Source filename displayed beside every disclosed fact
- Irreversible role-specific PDF redaction through Nutrient DWS
- Separate synthetic passport, flight, and hotel evidence PDFs
- Prepared Doctavian DOCX template and matching JSON data
- No real identity data or committed credentials

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Private browser OCR requires no API key and never uploads the source document. Nutrient DWS is optional and requires `NUTRIENT_DWS_API_KEY` only when that provider is selected.

## Private browser OCR

PDF.js renders up to three PDF pages locally and Tesseract.js reads those canvases in the browser. Images are passed directly to Tesseract. The normalized review fields preserve the source filename so identity facts cannot silently appear to come from an airline or hotel document. No request to Micro-Embassy or Nutrient is made during this path.

## Quality gates

```bash
npm run lint
npm run build
npm run test:e2e
```

Playwright covers provider readiness, upload error handling, role switching, revocation, reissue, and desktop/mobile layouts.

## Nutrient DWS

`POST /api/documents/extract` validates a temporary upload and forwards it to Nutrient DWS using a server-only Bearer key. The app requests deterministic JSON content with key-value pairs, plain text, and structured text. It normalizes every detected field, preserves the provider confidence score, flags suspicious values using deterministic checks, and requires human confirmation before disclosure. Without the key, the route returns `NUTRIENT_NOT_CONFIGURED`; it never substitutes synthetic output for a sponsor response. When Nutrient returns HTTP 402, the UI reports `NUTRIENT_CREDITS_EXHAUSTED`, links to the credits dashboard, and displays no fabricated extraction result.

`POST /api/documents/redact` creates role-specific PDFs using multiple `createRedactions` actions followed by `applyRedactions`. A post-redaction extraction verifies that protected underlying text is absent rather than visually covered.

See [`docs/integrations/nutrient-dws.md`](docs/integrations/nutrient-dws.md) for the contract and setup, and [`docs/screenshots/nutrient-human-review.png`](docs/screenshots/nutrient-human-review.png) for the verified review flow.

## Doctavian Documents

A reproducible emergency travel request template and matching JSON data are prepared in [`templates/doctavian`](templates/doctavian) and [`data/doctavian`](data/doctavian). The template contains 22 merge expressions and an `mdoc:table` evidence repeater. The registered trial currently returns `ApiKeyInvalid`; no Doctavian integration is claimed until the subscription is activated and a generated document is verified.

See [`docs/integrations/doctavian.md`](docs/integrations/doctavian.md) for the authenticated generation sequence.

## Planned integrations

Doctavian generation, e-signature, and persistent expiring links remain planned. Integrations will only be listed as complete after they run in the demo with real API calls.

## Safety

All documents and identities in the demo are synthetic. Never commit `.env` files, API credentials, real passport scans, or live emergency-case data.
