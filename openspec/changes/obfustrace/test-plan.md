# ObfusTrace Test Plan

- `npm run lint` exits 0 with no warnings.
- `npm run build` exits 0 with no server routes beyond framework defaults.
- `npm run test:e2e` passes core and browser tests.
- Bundled sample produces at least 9 unique mappings.
- Residual findings equal zero.
- Line count, stack-frame count, and canonical fingerprint remain preserved.
- Safe output contains no original email, IP, password, AWS account, JWT, or ARN.
- Rehydration restores selected originals locally.
