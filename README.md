# ObfusTrace

**Debug-equivalent synthetic traces for safe AI and support sharing.**

ObfusTrace turns a production error, stack trace, log excerpt, or configuration fragment into a safe synthetic twin before it is pasted into AI, Jira, Slack, GitHub, or vendor support.

It does more than replace values with `[REDACTED]`:

- repeated originals receive stable aliases;
- IPs, ARNs, UUIDs, emails, URLs, JWTs, and credentials retain useful structure;
- line count and stack-frame count remain unchanged;
- a structural fingerprint proves diagnostic equivalence;
- a second scan must find zero residual sensitive values before Copy is enabled;
- AI responses containing aliases can be rehydrated locally.

Raw traces and the mapping vault never leave the browser.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo

1. Inspect the included synthetic production failure.
2. Click **Create safe trace twin**.
3. Review detected categories and stable synthetic aliases.
4. Confirm the sanitization certificate is `CLEAN`.
5. Copy the safe trace for external debugging.
6. Paste an AI response containing aliases and click **Rehydrate locally**.

## Sample protection

The bundled trace includes a synthetic JWT, Bearer header, AWS access key, AWS ARN/account, database username/password, customer email, UUID, internal hostname, partner hostname, and repeated private IP.

Expected output:

- 10 unique sensitive values protected;
- repeated IP maps consistently to `192.0.2.1`;
- email maps to `user1@example.invalid`;
- stack frames and line count remain unchanged;
- residual findings equal zero;
- copy gate becomes enabled;
- local rehydration restores original values.

## Quality gates

```bash
npm run lint
npm run build
npm run test:e2e
```

Playwright validates detection, stable aliasing, residual scanning, diagnostic fingerprint preservation, copy gating, reversible local mapping, and mobile behavior.

## Boundaries

ObfusTrace reduces accidental disclosure risk; it is not a guarantee that arbitrary text contains no sensitive business information. High-risk organizations should combine it with existing secret scanning, DLP policy, and human review. The sample data is synthetic.
