# ObfusTrace Test Cases

## Scenario: Sensitive values are replaced consistently

Given a trace contains the same private IP twice
When a safe twin is created
Then both occurrences use the same reserved IP alias.

## Scenario: Diagnostic structure is preserved

Given a multiline stack trace
When sensitive values are replaced
Then line count and stack-frame count remain equal
And the canonical fingerprint is unchanged.

## Scenario: Copy is gated by residual scanning

Given sanitization has not run
Then Copy is disabled.
When sanitization produces zero residual findings and a preserved fingerprint
Then Copy is enabled.

## Scenario: Original values do not leave the safe output

Given the sample contains an email, password, AWS account, private IP, JWT, and ARN
When sanitization completes
Then none of those original values remain in the shareable trace.

## Scenario: AI response is rehydrated locally

Given an AI response references stable aliases
When the user chooses local rehydration
Then aliases are replaced by their original values only in the browser.

## Scenario: Mobile remains usable

Given a mobile viewport
When the application loads
Then there is no horizontal overflow
And the sanitization action is visible.
