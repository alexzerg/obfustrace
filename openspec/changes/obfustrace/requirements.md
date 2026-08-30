# ObfusTrace Requirements

## Problem

Engineers paste production errors into AI assistants, issue trackers, chat, and vendor support. Those traces can contain credentials, tokens, customer identifiers, internal hosts, cloud account IDs, and infrastructure topology.

## Core invariant

Raw text and the reversible mapping vault must remain in the browser. Copy is enabled only when the safe twin preserves diagnostic structure and a second scan finds zero residual sensitive values.

## Functional requirements

1. Detect common credentials, JWTs, Bearer tokens, AWS keys, ARNs/accounts, database URL credentials, emails, IPs, hostnames, and UUIDs.
2. Replace repeated originals with stable aliases.
3. Preserve useful formats using reserved documentation values.
4. Preserve line count and stack-frame count.
5. Compute a canonical diagnostic fingerprint before and after replacement.
6. Block Copy when any residual sensitive value or structural mismatch remains.
7. Display categories, occurrence counts, and aliases without revealing originals in the default view.
8. Keep the mapping in browser memory only.
9. Rehydrate an AI response locally by replacing aliases with originals.
10. Clearly state that sanitization reduces risk but is not an absolute guarantee.

## Quality requirements

- No server API or credentials required.
- Sample raw secrets must never appear in the safe output.
- Residual findings must equal zero for the bundled sample.
- Desktop and mobile Playwright tests must pass.
- Lint and production build must pass without warnings.
