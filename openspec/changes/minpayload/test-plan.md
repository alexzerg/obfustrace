# MinPayload Test Plan

- `npm run lint` must exit 0 with no warnings.
- `npm run build` must exit 0 and generate `/api/demo-airline/rebook`.
- `npm run test:e2e` must pass algorithm, API, UI, receipt, and mobile checks.
- Execution trace must contain 8 dry-runs and exactly 1 approved execution.
- Final execution keys must equal `booking_reference, flight, passenger_name, requested_date`.
- Secret scan and `git diff --check` must be clean.
