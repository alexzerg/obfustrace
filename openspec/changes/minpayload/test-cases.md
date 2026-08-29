# MinPayload Test Cases

## Scenario: Sensitive fields are empirically removed

Given an eight-field candidate payload
When MinPayload removes passport number, date of birth, nationality, and hotel one at a time
Then the target API dry-run continues to return 200
And all four fields remain excluded.

## Scenario: Required fields are restored

Given MinPayload removes passenger name, booking reference, flight, or requested date
When the target API returns 422 with a missing field
Then that field remains in the minimum payload.

## Scenario: Human approval gates execution

Given minimization has not completed
Then execution is disabled.
When the minimum payload is displayed
And the user approves it
Then exactly one non-dry-run API request executes.

## Scenario: Receipt proves what crossed the boundary

Given the approved action succeeds
Then the receipt contains the confirmation and exact received-field list
And passport number, date of birth, nationality, and hotel are absent.

## Scenario: Mobile remains usable

Given a mobile viewport
When the demo is opened
Then there is no horizontal overflow
And the minimization action remains visible.
