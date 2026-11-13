# Decisions, gaps and open questions

## Decisions made
- D1 Patient app is a PWA. Hospital dashboard is a normal website.
- D2 Theme is cream and yellow for both apps (red was dropped: it felt harmful to the eyes).
- D3 The memo, the endpoint document and the Backend Integration Guide are the authority. Teammate screens are a style guide only.
- D4 Urgency is shown as colour, shape and word, from one shared component.
- D5 Next.js, TypeScript, TanStack Query, Tailwind CSS. One repo with apps/patient, apps/hospital, packages/shared. Chosen by default; change only with a reason.
- D6 Plan is 15 working days, Tue 10 to Mon 30 Nov 2026 (Adam's own target; agreed delivery is December). Tasks are fixed per day; finished days let the next day be pulled forward.
- D7 Live map and blood donor feature are out of scope for now.
- D9 Mock data first: MSW answers API calls from the contract. The real backend is used from Day 10 (Tue 24 Nov).
- D8 English only. SUPER_ADMIN screens are out of scope.
- D10 Day 1 setup: Next.js 16.4 (Turbopack), React 19, Tailwind 4 with tokens in `packages/shared/src/styles/tokens.css`, one root ESLint config, Vitest in shared. Patient runs on port 3001, hospital on 3002 (port 3000 is taken on the dev machine). Urgency colours live only in `packages/shared/src/components/UrgencyBadge.tsx`.
- D11 Travel time: use routing `estimatedDurationMinutes` whenever the API returns it. Otherwise (mock data, missing duration) estimate 5 minutes per km to match the design examples (`1.2 km ~6 min`, `800 m ~4 min`). Set by `FALLBACK_MINUTES_PER_KM` in `packages/shared/src/lib/distance.ts`. Answers Q7.
- D12 The 7 moderate `npm audit` warnings in dev-only lint packages (@typescript-eslint, via eslint-config-next) are accepted. They do not ship to users. Never run `npm audit fix --force`; recheck when eslint-config-next updates. Answers Q8.
- D13 Day 2 "real backend check" is skipped and BLOCKED until a hosted dev backend exists (Q1). We do not wait on the backend: everything else runs on mocks. The check moves to Day 10 at the latest, together with the switch to the real backend.
- D14 The patient PWA service worker (`apps/patient/public/sw.js`) and MSW's worker cannot both control the page (one worker per scope). The PWA worker is registered only in production builds with mocks off. Test the PWA with `npm run preview:pwa` (port 3001, mocks off, API calls fail until a backend exists). The worker never caches pages or API calls; offline it shows `/offline` (no-connection message and a call button).
- D15 The two apps run on different origins (3001 and 3002), so each has its own in-browser mock data: a patient SOS on mocks does not reach the hospital board. The patient side gets EMERGENCY_ACCEPTED after 8 s; the hospital side gets new cases from `simulateIncomingEmergency()` (`@ems/shared/mocks`). The Day 9 "full-loop test on mock data" therefore runs as two half-loops; the true cross-app loop needs the real backend (Day 10).
- D16 HTTPS in development: `npm run dev:patient:https` (Next's `--experimental-https`, which creates a local certificate with mkcert on first run). Plain `npm run dev:patient` is fine for normal work, since browsers treat localhost as secure.

## Design versus backend gaps (handle as written)
- G1 Admin overview 7-day charts: no daily history endpoint. Build the counts in the browser from the assignments list (assignedAt).
- G2 My performance (staff): no endpoint for one staff member. Show hospital-level stats, and ask the backend team.
- G3 Case codes like ER-2048: build as ER-<request id>.
- G4 Cases page and filters: no all-cases endpoint. Filter and search in the browser.
- G5 Urgency colour codes are filled in `docs/design-system.md` (sampled from the design image). Done.
- G6 No logo or PWA icon files yet. Day 2: simple placeholders from the style sheet. Day 14: design the final logo and app icons.
- G7 WebSocket connects to port 8084 directly until the backend adds a gateway route.

## Open questions (mark answers here)
- Q1 Two asks for Yusuf, ideal by Fri 20 Nov, latest Tue 24 Nov: a hosted dev backend (base URL and WebSocket URL) and a super admin login to approve a test hospital. Test accounts are made by registering; email codes go to Adam's own emails.
- Q2 Staging and production URLs. The refresh cookie needs the apps and API on one registrable domain, or a proxy.
- Q3 Facility flag JSON key names in POST /hospital/register: read them from Swagger once connected. Not a question for Yusuf.
- Q4 Emergency phone number for the offline screen (design says "your local emergency number"; 112 is proposed). Decide later.
- Q5 Where to deploy (host and domain) and who owns it. Decide on Day 13.
- Q6 Does the project manager accept a 30 Nov finish, ahead of December?
- Q7 Travel time when the API gives no duration. ANSWERED Fri 13 Nov: 5 minutes per km, API duration first. See D11.
- Q8 `npm audit` warnings in dev-only lint packages. ANSWERED Fri 13 Nov: accepted, no `--force` fix. See D12.
- Q9 Shapes the contract does not spell out; the types in `packages/shared/src/api/types.ts` are assumptions marked "assumed". Confirm in Swagger on Day 10: the EmergencyRequest object (POST /emergency/request response, my-requests), the POST /auth/verify-2fa response (assumed same as login), the hospital-contact response, and whether /notifications/my/unread/count returns a bare number.
- Q10 For Day 10: the backend must allow CORS with credentials from http://localhost:3001 (patient) and http://localhost:3002 (hospital), on the gateway (8080) and the notification service (8084). Port 3000 is taken on the dev machine.
- Q11 What does POST /auth/login return for an account whose email is not verified yet? The patient login shows the backend's message as it is; confirm the wording and status in Swagger on Day 10, and whether to send the user to the verify screen instead.
- Q12 Phone number format for register (Nigerian 080... or +234...?). The patient form only checks that it is not empty and shows the backend's field message. Confirm on Day 10.
