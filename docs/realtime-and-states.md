# Real time, states and timers

## WebSocket (notifications only)
- URL (dev): http://localhost:8084/ws?token=<access JWT> (SockJS over STOMP). It connects straight to the notification service, not the gateway. Reconnect with a fresh token after every refresh.
- Patient subscribes to /user/queue/notifications. Staff and admin subscribe to /topic/hospital/{hospitalId} (everyone at that hospital gets the message).
- Message: {id,recipientId,recipientRole,hospitalId,type,title,message,emergencyRequestId,assignmentId,read,createdAt}.
- It does not carry case status, board updates or patient location. On every message, refetch the relevant data with the normal endpoints.
- There is no Web Push. When the app opens, call GET /notifications/my/unread to catch up. Staff keep the dashboard open during shifts.

## Notification types
- EMERGENCY_ASSIGNED: to the hospital topic when a request arrives (refetch assignments).
- EMERGENCY_ACCEPTED: to the patient when a hospital accepts. EMERGENCY_REROUTED: to the patient, new hospital. EMERGENCY_CANCELLED: to the patient, none left or stuck.
- TIMEOUT_WARNING: to the hospital about 1 minute before the deadline.
- Other enum values (EMERGENCY_REJECTED, PATIENT_EN_ROUTE, PATIENT_ARRIVED, ASSIGNMENT_TIMEOUT) are not emitted yet. Do not rely on them.
- Hospital names and distances are only inside the message text.

## Status values
- Request: PENDING, ASSIGNED, ACCEPTED, REJECTED, COMPLETED, CANCELLED.
- Assignment: PENDING, ACCEPTED, REJECTED, ARRIVED, CANCELLED. A timeout is recorded as REJECTED.
- Hospital: PENDING, APPROVED, REJECTED, SUSPENDED, INACTIVE.
- Live board columns: Pending, Accepted (on the way), Arrived.

## Timers
- A hospital has 4 minutes to respond, 2 minutes for RED. The deadline is `timeoutAt` on each assignment: count down from it.
- Urgency does not escalate. A timeout can fire up to about 30 seconds after `timeoutAt`.
- After a timeout or rejection the backend reroutes to the next nearest hospital. If none is left the request becomes CANCELLED.
- A request stuck in ASSIGNED for more than 30 minutes is cancelled automatically.

## Lifecycle
Patient taps SOS, POST /emergency/request, request PENDING then ASSIGNED, hospitals get EMERGENCY_ASSIGNED. A hospital accepts, request ACCEPTED, others CANCELLED, patient gets EMERGENCY_ACCEPTED.
Patient sends location every ~5 s. Hospital marks arrived. Patient completes, then rates 1 to 5.
