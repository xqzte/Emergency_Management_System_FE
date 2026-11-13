# Product brief

QuickSave EMS connects a patient having a medical emergency with the nearest available hospital in real time.
Every screen is judged by one question: does it make a stressful, time-critical moment easier and clearer?

## Users and apps
- Patient: mobile PWA. Speed and calm clarity. Big, obvious actions. Never leave them wondering what is happening.
- Hospital staff (HOSPITAL_STAFF): website. A live board they can read at a glance and act on in seconds.
- Hospital admin (HOSPITAL_ADMIN): same website, higher tier. Staff, beds, performance, activity, settings.
- SUPER_ADMIN screens are a separate surface and are not ours.

## Core flow
- DIRECT: the patient picks one nearby hospital. BROADCAST (SOS): sent to every nearby hospital; first to accept wins, the rest are cancelled.
- Every request has a triage level: RED, ORANGE, YELLOW, GREEN (shown as Critical, Urgent, Moderate, Minor).
- Hospital flow: pending, accepted, arrived. Patient completes the request, then rates it.
- Distance and time appear everywhere and must be formatted the same way.

## Pages
Patient: onboarding, register, code verification, login, reset password, home with SOS, nearby hospitals, confirm request,
waiting, hospital found, tracking (map placeholder), completed and rating, history, medical profile, documents, notifications, settings.
Hospital: sign in, admin 2FA code, register hospital, live board, case detail, cases (filters), overview, bed capacity,
notifications, my performance, settings (hospital profile, team and access, activity, security).
Not built on the backend yet: the live map, the blood donor feature (a "Coming soon" row only).
