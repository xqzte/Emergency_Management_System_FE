# Design system (from the approved design PDF, screen 1 style sheet)

One look for both apps: cream, white and soft yellow.

## Colours
- Cream #F7F6F2 screen background. White #FFFFFF cards and inputs.
- Yellow #F0DC82 main buttons and logo. Gold #B58F00 selected, focus. Link #7A6200.
- Ink #1F1F1B text and outlines. Muted #6B6B66 secondary text.

## Urgency (never differs between screens or apps): colour, shape and word together
- Critical: solid brick, octagon. Life-threatening. API value RED.
- Urgent: orange outline, triangle. Serious, needs care soon. API value ORANGE.
- Moderate: yellow outline, diamond. Needs care, not immediately dangerous. API value YELLOW.
- Minor: green outline, circle. Minor injury or illness. API value GREEN.
- Badge colours, sampled from the design image (confirm against the design if the designer is available):
  - Critical: fill #8B2A23 (brick), white text and white octagon.
  - Urgent: fill #FBEBD2, text, triangle and outline #874100.
  - Moderate: fill #F9F2C8, text, diamond and outline #625001.
  - Minor: fill #E5EFE4, text, circle and outline #226336.
  - Put these in the shared urgency component only. Never repeat them in screens.

## Type and buttons
- Font Inter. Heading 32/400, Title 20/600, Body 16 (never smaller on phones).
- Primary button yellow. Secondary button outlined.

## Formats
- Distance: `1.2 km ~6 min`. Under 1 km use metres: `800 m ~4 min`.
- Times in West Africa Time (WAT). Case code shown as ER-<request id>.
- Hospital live board: sorted by urgency first, then time left. Timers under 30 seconds flash.
- Status line "Emergency network connected" shows the WebSocket state.

## Navigation
- Patient bottom bar: Home, History, Alerts, Profile.
- Hospital sidebar: Overview, Live board, Cases, Beds, Settings. Overview is admin only.

## Screens (32 pages in the PDF)
1 Style sheet. Patient: 2 Home and SOS, 3 Confirm request, 4 Waiting, 5 Hospital found, 6 Login, 7 Nearby hospitals,
8 Tracking, 9 Completed and rating, 10 Onboarding, 11 Register, 12 Verify code, 13 Reset password, 14 History,
15 Medical profile, 16 Documents, 17 Notifications, 18 Settings.
Hospital: 19 Live board, 20 Overview (admin), 21 Sign in, 22 Admin verification, 23 Register hospital, 24 Cases,
25 Case detail, 26 Bed capacity, 27 Notifications, 28 My performance, 29 Settings team and access, 30 Settings activity,
31 Settings security, 32 Settings hospital profile.
