# MinPayload

**Empirical data minimization for AI-agent API actions.**

MinPayload finds the smallest set of personal fields an AI agent needs to complete an action. It removes one field at a time, tests each candidate against the target API's dry-run contract, keeps only removals that still succeed, requests human approval, executes the minimum payload, and produces an audit receipt.

## Why

Static allowlists guess what an API needs. MinPayload proves it experimentally.

For the included flight-rebooking scenario, an agent starts with eight fields from passport, flight, hotel, and user-request context. MinPayload executes eight dry-run requests and determines that passport number, date of birth, nationality, and hotel are unnecessary. The final execution sends only passenger name, booking reference, current flight, and requested date.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Executable demo

1. Click **Run payload minimization**.
2. Inspect each field-removal experiment and its actual API status.
3. Review the minimum successful JSON payload.
4. Click **Approve and execute minimal payload**.
5. Inspect the rebooking confirmation and exact list of transmitted fields.

The target is a synthetic airline API implemented at `POST /api/demo-airline/rebook`. `?dryRun=true` validates candidate payloads without executing the action. The final approved request performs one synthetic rebooking and returns a deterministic receipt.

## Verified result

- Starting context: 8 fields
- Dry-run experiments: 8
- Minimum payload: 4 fields
- Data reduction: 50%
- Blocked: passport number, date of birth, nationality, hotel
- Executed action: rebook `AF1249` to `AF1449`
- Confirmation: deterministic `REBOOK-*` receipt

## Quality gates

```bash
npm run lint
npm run build
npm run test:e2e
```

Playwright validates the minimization algorithm, insufficient and sufficient dry-run payloads, final API execution, audit receipt, responsive layout, and exact absence of sensitive fields from the execution request.

## Boundaries

The included airline API and traveler data are synthetic. MinPayload does not claim a real flight was changed. The prototype proves the minimization and execution-control mechanism that can sit in front of a real API gateway or agent tool call.
