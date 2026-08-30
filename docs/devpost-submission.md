# ObfusTrace — Devpost Submission Metadata

## Project name

ObfusTrace

## Subtitle

Debug-Equivalent Synthetic Traces for Safe AI Sharing

## Pitch (182/200 characters)

ObfusTrace creates a debug-equivalent synthetic twin of production logs, preserving stack structure while replacing credentials and infrastructure identifiers before sharing with AI.

## Built with

- Next.js
- React
- TypeScript
- Tailwind CSS
- Node.js
- Playwright
- Local-First
- Secret Detection
- Format-Preserving Obfuscation
- Data Loss Prevention
- Privacy Engineering
- GitHub
- Vercel
- Responsive Design
- Accessibility

## Try it out

- Source code: https://github.com/alexzerg/obfustrace
- Live demo: https://obfustrace.vercel.app
- Demo video: not recorded yet

## Product boundary

The sample trace and credentials are synthetic. ObfusTrace performs all sanitization and rehydration locally in the browser. It reduces accidental disclosure risk but does not guarantee that arbitrary text contains no sensitive business information; residual scanning and human review remain mandatory.
