# Micro-Embassy Implementation Plan

1. Capture the incident before document processing.
   - Done when the user provides nationality, current location, lost item, incident date, and planned departure.
2. Match a curated official recovery procedure.
   - Done when the France-in-Barcelona demo identifies the consulate and exposes only official source URLs.
3. Review and correlate independent evidence sources.
   - Done when browser OCR keeps passport, flight, and hotel facts separate, requires document owners, and blocks identity conflicts.
4. Build a Recovery Action Board.
   - Done when the board distinguishes completed preparation from required actions and defaults to Not submitted.
5. Prepare an official-channel message.
   - Done when the message uses incident and reviewed case facts and explicitly states that copying does not send it.
6. Track evidence of outcome.
   - Done when an official reference can be recorded only as user-provided and unverified.
7. Retain purpose-bound sharing as a secondary layer.
   - Done when only selected recipient links are rendered and revoke/reissue continues to work.
8. Validate and publish.
   - Done when official URLs return 2xx, lint/build pass, all Playwright tests pass, production smoke passes, and GitHub/Vercel are updated.
