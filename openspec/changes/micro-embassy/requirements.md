# Micro-Embassy Requirements

## Problem

After losing travel documents abroad, a traveler does not primarily need another place to store scans. They need to identify the competent official authority, understand the official recovery procedure, prepare the required information, use the correct submission channel, and distinguish preparation from verified acknowledgement.

## Product boundary

Micro-Embassy is a recovery-action agent, not a government service, identity credential, travel planner, or guarantee of delivery. It may prepare messages and evidence packages, open official channels, and record user-provided references. It must never label an action sent, delivered, acknowledged, or accepted without corresponding evidence.

## Functional requirements

1. Capture nationality, current location, lost item, incident date, and planned departure.
2. Match only curated or allowlisted official government sources.
3. Show the competent authority, published contact channel, address, telephone, hours, and appointment requirement.
4. Keep independently reviewed passport, flight, and hotel documents separate with field-level provenance.
5. Require a human-confirmed owner for every document and block cross-person merges.
6. Generate a prepared contact message from incident and reviewed evidence.
7. Show recovery actions with separate Required, Official channel opened, and User marked complete states.
8. Default the overall outcome to Not submitted.
9. Record an official reference as user-provided and not independently verified.
10. Render only recipient agencies explicitly selected by the user.
11. Keep purpose-bound links, expiration, and revocation as a secondary privacy layer.
12. Keep private browser OCR free and local; external providers remain optional.

## Non-functional requirements

- Responsive from 360px mobile width through desktop.
- Keyboard-accessible controls with visible focus states.
- No secrets or real identity data in the client bundle.
- Every official claim must link to an allowlisted source and include a verification date.
- Production build and lint must pass.
- Core incident, evidence, action-board, and privacy flows must be covered by Playwright.
