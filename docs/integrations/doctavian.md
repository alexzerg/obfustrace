# Doctavian Documents Integration

## Authentication

Doctavian Documents API calls require both:

- `Authorization: Bearer <OAuth access token>`
- `x-api-key: <Documents API key>`

The first read-only proof is `GET https://api.doctavian.com/v1/documents/document/list`.

## Current credential status

The registered trial currently returns `401 Unauthorized ApiKeyInvalid` for the supplied key. The key format is clean, so the Documents subscription likely requires activation by Doctavian. Contact `hello@doctavian.com` and reference the API + Cloud + AI Hackathon 2026.

## Prepared artifacts

- Template: `templates/doctavian/emergency-travel-request.docx`
- Data: `data/doctavian/emergency-travel-request.json`
- Generator: `scripts/generate-doctavian-template.py`

The template uses Doctavian merge expressions such as `{!Case[0].Traveler.FullName}` and an `mdoc:table` repeater for evidence records.

## Planned verified sequence

1. `GET /v1/documents/document/list` — authenticate.
2. `POST /v1/documents/datasource/create` — storage data source.
3. `POST /v1/documents/solution/create` — bind the data source.
4. `POST /v1/documents/template/upload` — upload the DOCX template.
5. `POST /v1/documents/data/upload` — upload the reviewed JSON evidence.
6. `POST /v1/documents/document/generate` — generate a PDF.
7. Download and inspect the generated package before any signature operation.
