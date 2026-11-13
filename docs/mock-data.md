# Mock data: use fake data first

Rule: every API call goes through the shared API client. When `NEXT_PUBLIC_USE_MOCKS=true`, MSW (Mock Service Worker) answers
with the shapes in `docs/api-contract.md`. Switching to the real backend means changing that variable and the base URL.
Build and test every screen on mocks first. The real backend is needed only from Day 10 (Tue 24 Nov; ideally available by Fri 20) for the checks below.

## Mock WebSocket
A small fake client emits the notification types from `docs/realtime-and-states.md`, on a timer or from a hidden "simulate" button
(the design already has "Prototype: simulate a hospital accepting" on screen 4). After a BROADCAST request, send EMERGENCY_ACCEPTED after about 8 seconds.

## Mock users (fake logins)
- Patient: Adam Test, patient@example.test. Hospital staff: Amina Staff. Hospital admin: Musa Admin (2FA on).
- Every email code and 2FA code is 123456. Any password of 8 or more characters works, except "wrongpass1", which returns the 400 error.

## Mock hospitals (names follow the design; area-centre coordinates are approximate; beds are invented)
| Id | Name | Area | Lat, Lng | Type | Beds free / total |
| --- | --- | --- | --- | --- | --- |
| 1 | Garki General Hospital | Garki Area 3 | 9.0336, 7.4881 | PUBLIC | 8 / 40 |
| 2 | Wuse Specialist Clinic | Wuse Zone 5 | 9.0765, 7.4698 | PRIVATE | 3 / 20 |
| 3 | Maitama District Hospital | Maitama | 9.0836, 7.4931 | PUBLIC | 12 / 60 |
| 4 | Asokoro Medical Centre | Asokoro | 9.0388, 7.5200 | PRIVATE | 1 / 15 |
| 5 | Gwarinpa Community Hospital | Gwarinpa | 9.1107, 7.4029 | PUBLIC | 9 / 50 |
| 6 | Central District Hospital | Central District | 9.0560, 7.4890 | FEDERAL | 20 / 120 |
Patient test location: 9.0579, 7.4951. Distance is a straight-line estimate; time is about 3 minutes per km.
Hospital 4 is full-ish and hospital 6 is large, so the nearby list shows variety.

## Mock cases for the hospital board (hospital 1)
Ibrahim M., 54, chest pain, RED, pending. Fatima S., 7, allergic reaction, ORANGE, accepted. Tunde A., 41, road accident, YELLOW, pending.
Grace O., 29, 2 people, high fever, YELLOW, pending. John E., 33, deep cut, GREEN, arrived. Set `timeoutAt` a few minutes ahead of now (RED: 2 minutes).

## Mock errors to cover
401 then a successful refresh. 429 after five logins in a minute. 409 when accepting a case another hospital took.
400 validation with a fields object. A plain-text success body. No hospital available (409).

## What mocks cannot prove (test these on the real backend)
- The login refresh cookie across the real domains, and CORS.
- The real WebSocket message format and connection.
- Real timeout and reroute timing.
- Real distance and time from the backend.
- Real error texts. Keep the mocks for demos and tests afterwards.
