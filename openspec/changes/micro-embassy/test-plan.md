# Micro-Embassy Test Plan

## Gate 1: Static analysis

Command: `npm run lint`
Pass condition: exit code 0 and no ESLint errors.

## Gate 2: Production compilation

Command: `npm run build`
Pass condition: exit code 0 and Next.js reports a successful production build.

## Gate 3: End-to-end core flow

Command: `npm run test:e2e`
Pass condition: exit code 0 with all Playwright tests passing.

## Gate 4: Repository hygiene

Command: `git status --short`
Pass condition: output contains only intentional project files and no environment or secret files.
