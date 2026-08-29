# MinPayload Requirements

## Problem

AI agents often receive more personal context than a target API action requires. Static field allowlists guess which data is necessary and drift as APIs change.

## Core invariant

MinPayload must experimentally prove that a field is unnecessary by removing it and executing the target API's dry-run validation. It may execute the real action only after human approval of the smallest successful payload.

## Functional requirements

1. Display every candidate field with value source and sensitivity.
2. Start from the complete candidate payload.
3. Remove one field per dry-run experiment.
4. Keep a field removed only when the target API still accepts the candidate.
5. Restore a field when the API reports it missing.
6. Show HTTP status, missing fields, and remaining field count for every experiment.
7. Require explicit human approval before final execution.
8. Send only the minimum successful payload in the execution request.
9. Return an execution receipt containing confirmation, outcome, and exact fields received.
10. Never claim the synthetic airline action changed a real reservation.

## Quality requirements

- Zero credentials required for the synthetic demo.
- No sensitive field may appear in the final execution request.
- The minimization algorithm must be independently unit tested.
- The full UI must remain usable on desktop and mobile.
- Lint, production build, API contract tests, and Playwright flows must pass.
