# QuickSave EMS frontend

Emergency app. A patient in distress sends a request; nearby hospitals are alerted; the first to accept takes the case.
Two apps in one repository. The backend is already built and is not ours to change.

## Structure
- `apps/patient`: mobile-first PWA for patients (installable website).
- `apps/hospital`: normal website (not a PWA) for HOSPITAL_STAFF and HOSPITAL_ADMIN.
- `packages/shared`: API client, types, urgency definitions, distance formatting.

## Stack
Next.js (App Router) with TypeScript, TanStack Query, Tailwind CSS using the tokens in `docs/design-system.md`,
STOMP over SockJS for the WebSocket. English only. Show times in West Africa Time (Africa/Lagos).

## Commands (run from the repo root)
- `npm run dev:patient` (port 3001), `npm run dev:hospital` (port 3002), `npm run build`, `npm run lint`, `npm test`
- Port 3000 is taken on the dev machine: always run the patient app on port 3001 (the hospital app uses 3002).
- `npm run dev:patient:https` (HTTPS dev, port 3001), `npm run preview:pwa` (production build with mocks off, port 3001, to test the PWA)
- Mocks are on by default (`NEXT_PUBLIC_USE_MOCKS=true` in `apps/*/.env`). Override in `.env.local`.

## Where to look (read the file before building the related screen; do not import them all)
- `docs/build-plan.md`: the 15-day task list. Work from here.
- `docs/design-system.md`: colours, type, urgency look, distance format, the 32 screens.
- `docs/api-contract.md`: every endpoint we may call, with fields, errors and limits.
- `docs/realtime-and-states.md`: WebSocket, notification events, status values, timers.
- `docs/mock-data.md`: fake users, hospitals and cases. Use mocks first.
- `docs/decisions-and-gaps.md`: decisions made, design versus backend gaps, open questions.
- `docs/product-brief.md`: users, flows, page list.
The approved design PDF is in the EMS Drive folder, Designs (UI/UX).

## Rules that must never break
1. Urgency looks identical on every screen: colour, shape and word together, from one shared component.
   Critical = RED (octagon), Urgent = ORANGE (triangle), Moderate = YELLOW (diamond), Minor = GREEN (circle).
2. Only call endpoints listed in `docs/api-contract.md`. Never call `/auth/internal/**`,
   `/notifications/hospital/assignment`, `/notifications/patient/*` or `/notifications/hospital/timeout-warning`.
3. Many responses are plain text, not JSON. Check the content type before parsing.
4. Keep the access token in memory only. Send `credentials: 'include'` on every request so the refresh cookie travels.
   On 401, call `POST /auth/refresh` once, then retry once. On 429, tell the user to wait.
5. The WebSocket carries notifications only. Treat each message as a signal, then refetch the data with the normal endpoints.
6. Count down from the assignment `timeoutAt`, never from a hard-coded number.
7. Use mock data first (`docs/mock-data.md`); the real backend is only for the full-loop test. Never invent endpoints. If something a screen needs is not in the contract, add a question to
   `docs/decisions-and-gaps.md` and use a clearly marked placeholder.
8. Body text is never smaller than 16 on phones. The live map is a placeholder ("Live map coming soon").
9. Offline never fakes an SOS: show a clear no-connection message with a call option.

## How to work
- One day at a time from `docs/build-plan.md`. For a big change, plan first and show the plan.
- Keep changes small. Run lint and build before saying a task is done.
- Tick finished tasks in the build plan and add one line to its progress log.
- Do not edit the design PDF, this file's rules, or the backend.
