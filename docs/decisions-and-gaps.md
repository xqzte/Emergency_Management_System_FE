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
- D10 Day 1 setup: Next.js 16.4 (Turbopack), React 19, Tailwind 4 with tokens in `packages/shared/src/styles/tokens.css`, one root ESLint config, Vitest in shared. Patient runs on port 3000, hospital on 3001. Urgency colours live only in `packages/shared/src/components/UrgencyBadge.tsx`.

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
- Q7 Travel time when the API gives no duration: `docs/mock-data.md` says about 3 min per km, but the design examples (`1.2 km ~6 min`, `800 m ~4 min`) imply 5 min per km. Using 3 min per km (`FALLBACK_MINUTES_PER_KM` in `packages/shared/src/lib/distance.ts`) until decided; routing `estimatedDurationMinutes` is used whenever present.
- Q8 `npm audit` shows 7 moderate warnings in dev-only lint packages (@typescript-eslint, via eslint-config-next). Not shipped to users; recheck when eslint-config-next updates.
