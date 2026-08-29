# Micro-Embassy Requirements

## Problem

A traveler who loses identity and travel documents abroad must repeatedly disclose sensitive information to unrelated organizations while under stress. Existing travel assistants focus on preparation, not post-incident recovery.

## Product boundary

Micro-Embassy activates only after a document-loss incident. It creates a temporary emergency case, publishes recipient-specific minimum-disclosure views, and revokes or destroys access when the case closes.

## Functional requirements

1. The demo must represent one synthetic emergency case without real personal data.
2. Police, consulate, airline, and hotel recipients must receive different data views.
3. Each recipient link must expose only an allowlisted set of fields.
4. Each link must have an explicit expiration and revocation state.
5. The traveler must be able to preview, revoke, and reissue recipient access.
6. The interface must show an auditable event timeline.
7. The product must clearly distinguish itself from travel planning and document wallets.
8. Future integrations must keep OCR, search, document generation, and signing behind server-side boundaries.

## Non-functional requirements

- Responsive from 360px mobile width through desktop.
- Keyboard-accessible controls with visible focus states.
- No secrets or real identity data in the client bundle.
- Production build and lint must pass.
- Core demo path must be covered by Playwright.
