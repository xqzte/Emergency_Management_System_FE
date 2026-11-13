# Build plan: 15 task-days over 5 EMS sessions

Your calendar gives EMS two 3-hour sessions a week: Tuesday and Friday, 09:00 to 12:00. Thursday 14:00 to 15:30 is taken by the ebook task and
Subzero Studio outreach, so it is not an EMS slot. Sessions left: Fri 13, Tue 17, Fri 20, Tue 24, Fri 27 Nov = about 15 hours, so each task-day is
about 1 hour with Claude Code. That is tight. Sat 28 and Mon 30 Nov are buffer, and the agreed delivery is December.
Each task-day has a fixed list. Finish it, tick it, stop. If a session finishes early, pull the next task-day forward.
Cut rule: if a milestone slips, these move after 30 Nov in this order: activity log tab, performance charts, document upload polish, install prompt.
Screen numbers refer to the design PDF (see `docs/design-system.md`).

## Session schedule
- Fri 13 Nov: Days 1, 2, 3
- Tue 17 Nov: Days 4, 5, 6. M1 report after Day 4 (foundation and all login flows)
- Fri 20 Nov: Days 7, 8, 9. M2 report: end-to-end demo on mock data
- Tue 24 Nov: Days 10, 11, 12. Day 10 switches to the real backend
- Fri 27 Nov: Days 13, 14, 15. M3 report after Day 13 (every screen built), M4 at the end (release candidate)

## Before Day 1 (a 5 minute task, from a phone)
- [ ] Message Yusuf with the two asks (hosted dev backend and a super admin login). Not blocking: ideal by Fri 20 Nov, latest Tue 24 Nov (Day 10). Answers go in `docs/decisions-and-gaps.md`
## Day 1
- [x] Repo set up, first push, workspaces, lint, build
- [x] Urgency colour codes are already in `docs/design-system.md`
- [x] Design tokens and shared components: urgency badge, distance text, buttons, inputs, cards (screen 1)
## Day 2
- [x] API client with token refresh, error handling, plain-text responses
- [x] WebSocket client with reconnect and the connection status line
- [x] Patient PWA shell over HTTPS (manifest, service worker, placeholder logo and icons from the style sheet)
- [x] Mock API with MSW and sample data from `docs/mock-data.md`, switched by one environment variable
- [ ] BLOCKED until a hosted dev backend exists (Q1, D13): Try every needed endpoint against the real backend and note differences in `docs/decisions-and-gaps.md`
## Day 3
- [x] Patient: onboarding (10), register (11), verify code (12), login (6), reset password (13)
## Day 4 (M1 report)
- [ ] Hospital: sign in (21), admin code (22), register hospital with pending state (23), role-based routing
## Day 5
- [ ] Patient: home with SOS and urgency picker (2), nearby hospitals (7), confirm request (3)
## Day 6
- [ ] Patient: send DIRECT and BROADCAST requests, waiting (4), hospital found (5)
## Day 7
- [ ] Patient: tracking with location sharing and map placeholder (8), completed and rating (9), history (14), cancel
## Day 8
- [ ] Hospital: live board with countdown timers, accept, reject, mark arrived (19)
## Day 9 (M2 report)
- [ ] Hospital: case detail with snapshot and location (25), notifications (27). Patient: notifications (17)
- [ ] Full-loop test on mock data: SOS, hospital accepts, patient tracked to arrival
## Day 10
- [ ] Switch to the real hosted backend and fix the differences. Check the cookie refresh, CORS, WebSocket, timeouts and distances
- [ ] Hospital admin: overview (20), bed capacity (26), hospital profile (32)
## Day 11
- [ ] Hospital admin: team and access (29), cases with filters (24), activity (30), security (31)
## Day 12
- [ ] Patient: medical profile (15), documents (16), settings (18)
## Day 13 (M3 report)
- [ ] Hospital staff: my performance (28). Offline and no-hospital states. Install prompt
- [ ] Choose the deploy host and domain (the login cookie needs the apps and API on one domain, or a proxy)
## Day 14
- [ ] Polish every screen against the design, loading, empty and error states
- [ ] Design the final logo and app icons, replace the placeholders
## Day 15 (M4 report)
- [ ] Test on a real Android phone, a real iPhone (borrow one before Day 14) and desktop, PWA check on the patient app, deploy, handover notes

## Progress log
(one line per day: date, what is done, what is blocked)
- Fri 13 Nov, Day 1: npm workspaces monorepo (Next 16, Tailwind 4, ESLint, Vitest), shared tokens, UrgencyBadge, DistanceText, Button, Input, Card, /style page in both apps; lint, test, build green. First push done; Day 1 closed (travel-time fallback set to 5 min per km, D11).
- Fri 13 Nov, Day 2: API client (memory token, refresh-once on 401, 429, plain text, forbidden-path guard), STOMP/SockJS socket with reconnect and status line, MSW mock API and mock socket, patient PWA shell (manifest, icons, service worker, offline page, HTTPS dev script); 31 tests, lint, build green; committed and pushed. Blocked: real backend check waits for a hosted dev backend (D13).
- Fri 13 Nov, Day 3: patient onboarding (10), register (11), verify code (12), login with 2FA step (6), reset password (13), session restore from the refresh cookie, shared auth calls (register, verify, resend, forgot, reset) with a test; 37 tests, lint, build green. Not done: real backend check (still D13).
