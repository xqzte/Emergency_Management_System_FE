/**
 * MSW handlers answering with the shapes in docs/api-contract.md. Mock mode only.
 * Covers the endpoints for Days 3 to 9. Later screens (profile, documents, staff, logs) add handlers on their day.
 *
 * Triggers for the error cases in docs/mock-data.md:
 * - Password "wrongpass1" on login: 400. A sixth login within a minute: 429 (plain text).
 * - Register with a bad email or a password under 8: 400 with a fields object. Register success: plain text.
 * - Any code other than 123456: 400.
 * - Access tokens last 2 minutes, so the next call gets 401 and the client refreshes.
 * - Accepting Grace O. (assignment 904): 409, another hospital took it.
 * - SOS with "no hospital" in the description: 409, no hospital available.
 */
import { http, HttpResponse, delay } from "msw";
import { API_BASE_URL } from "../api/config";
import type {
  Assignment,
  CreateEmergencyRequest,
  EmergencyRequest,
  HospitalResponse,
  NotificationMessage,
} from "../api/types";
import { mockNotificationBus } from "../realtime/mockBus";
import { PATIENT_DESTINATION, hospitalDestination } from "../realtime/types";
import {
  MOCK_CODE,
  MOCK_USERS,
  MOCK_WRONG_PASSWORD,
  PATIENT_LOCATION,
  TAKEN_BY_OTHER_HOSPITAL_ASSIGNMENT_ID,
  haversineKm,
  makeBoardAssignments,
  makeHospitals,
  makeNotification,
  mockMinutes,
  type MockUser,
} from "./data";
import { getMockSession, issueMockToken, readMockToken, setMockSession } from "./session";

/** Hospital accepts a patient SOS after this long (docs/mock-data.md: about 8 seconds). */
export const MOCK_ACCEPT_DELAY_MS = 8000;

const url = (path: string) => `${API_BASE_URL}${path}`;
const json = HttpResponse.json;
const text = (body: string, status = 200) => HttpResponse.text(body, { status });
const error = (status: number, message: string) => json({ error: message }, { status });
/** Spring's default 401/403 is not JSON. */
const unauthorized = () => new HttpResponse(null, { status: 401 });
const forbidden = () => new HttpResponse(null, { status: 403 });

interface MockDb {
  users: MockUser[];
  hospitals: HospitalResponse[];
  assignments: Assignment[];
  requests: EmergencyRequest[];
  notifications: NotificationMessage[];
  nextId: number;
}

let db: MockDb;

export function resetMockDb(): void {
  const hospitals = makeHospitals();
  db = {
    users: MOCK_USERS.map((u) => ({ ...u })),
    hospitals,
    assignments: makeBoardAssignments(hospitals[0]),
    requests: [],
    notifications: [],
    nextId: 3000,
  };
  loginAttempts.length = 0;
}

const loginAttempts: number[] = [];
function loginRateLimited(): boolean {
  const now = Date.now();
  while (loginAttempts.length && now - loginAttempts[0] > 60_000) loginAttempts.shift();
  loginAttempts.push(now);
  return loginAttempts.length > 5;
}

function currentUser(request: Request): MockUser | null {
  const claims = readMockToken(request.headers.get("Authorization"));
  return claims ? (db.users.find((u) => u.id === claims.userId) ?? null) : null;
}

function withUser(request: Request, roles: MockUser["role"][], fn: (user: MockUser) => Response | Promise<Response>) {
  const user = currentUser(request);
  if (!user) return unauthorized();
  if (!roles.includes(user.role)) return forbidden();
  return fn(user);
}

const PATIENT: MockUser["role"][] = ["PATIENT"];
const HOSPITAL: MockUser["role"][] = ["HOSPITAL_STAFF", "HOSPITAL_ADMIN"];
const ANYONE: MockUser["role"][] = ["PATIENT", "HOSPITAL_STAFF", "HOSPITAL_ADMIN"];

function loginResponse(user: MockUser) {
  setMockSession(user.id);
  return json({ token: issueMockToken(user), role: user.role, userId: user.id, requiresTwoFactor: false, message: "Login successful" });
}

function withDistance(h: HospitalResponse, lat: number, lng: number): HospitalResponse {
  return { ...h, distanceKm: haversineKm(lat, lng, h.latitude, h.longitude) };
}

function notify(destination: string, n: NotificationMessage) {
  db.notifications.unshift(n);
  mockNotificationBus.publish(destination, n);
}

/** BROADCAST: nearest hospital with beds accepts. DIRECT: the chosen hospital accepts. */
function scheduleAcceptance(req: EmergencyRequest, patient: MockUser) {
  setTimeout(() => {
    if (req.status !== "ASSIGNED") return; // cancelled meanwhile
    const assignment = db.assignments.find((a) => a.emergencyRequest.id === req.id && a.status === "PENDING");
    if (!assignment) return;
    assignment.status = "ACCEPTED";
    assignment.respondedAt = new Date().toISOString();
    req.status = "ACCEPTED";
    notify(
      PATIENT_DESTINATION,
      makeNotification({
        type: "EMERGENCY_ACCEPTED",
        title: "Hospital found",
        message: `${assignment.hospitalName} accepted your request. ${assignment.distanceKm} km away.`,
        recipientId: patient.id,
        recipientRole: "PATIENT",
        emergencyRequestId: req.id,
        assignmentId: assignment.id,
      }),
    );
  }, MOCK_ACCEPT_DELAY_MS);
}

resetMockDb();

export const handlers = [
  // ---------- Auth ----------
  http.post(url("/auth/register"), async ({ request }) => {
    const body = (await request.json()) as Record<string, string>;
    const fields: Record<string, string> = {};
    if (!body.fullName?.trim()) fields.fullName = "Full name is required";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email ?? "")) fields.email = "Must be a valid email address";
    if (!body.phoneNumber?.trim()) fields.phoneNumber = "Phone number is required";
    if ((body.password ?? "").length < 8) fields.password = "Password must be at least 8 characters";
    if (Object.keys(fields).length) return json({ error: "Validation failed", fields }, { status: 400 });
    if (db.users.some((u) => u.email === body.email)) return error(409, "An account with this email already exists");
    db.users.push({
      id: db.nextId++,
      fullName: body.fullName,
      email: body.email,
      phoneNumber: body.phoneNumber,
      role: "PATIENT",
      hospitalId: null,
      twoFactor: false,
    });
    return text("Registration successful. Check your email for the verification code.");
  }),

  http.post(url("/auth/verify-otp"), async ({ request }) => {
    const { otp } = (await request.json()) as { otp: string };
    return otp === MOCK_CODE ? text("Email verified successfully") : error(400, "Invalid or expired code");
  }),

  http.post(url("/auth/resend-otp"), () => text("A new code has been sent")),

  http.post(url("/auth/login"), async ({ request }) => {
    await delay(300);
    if (loginRateLimited()) return text("Too many requests", 429);
    const { email, password } = (await request.json()) as { email: string; password: string };
    if (!password || password.length < 8 || password === MOCK_WRONG_PASSWORD) {
      return error(400, "Invalid email or password");
    }
    // Any other email signs in as the mock patient.
    const user = db.users.find((u) => u.email === email?.trim().toLowerCase()) ?? db.users[0];
    if (user.twoFactor) {
      return json({ token: null, role: null, userId: null, requiresTwoFactor: true, message: "A code has been sent to your email" });
    }
    return loginResponse(user);
  }),

  http.post(url("/auth/verify-2fa"), async ({ request }) => {
    const { email, otp } = (await request.json()) as { email: string; otp: string };
    const user = db.users.find((u) => u.email === email?.trim().toLowerCase());
    if (!user || otp !== MOCK_CODE) return error(400, "Invalid or expired code");
    return loginResponse(user);
  }),

  http.post(url("/auth/refresh"), () => {
    const userId = getMockSession();
    const user = db.users.find((u) => u.id === userId);
    if (!user) return unauthorized();
    return json({ accessToken: issueMockToken(user), role: user.role, userId: user.id });
  }),

  http.post(url("/auth/logout"), () => {
    setMockSession(null);
    return text("Logged out successfully");
  }),

  http.get(url("/auth/me"), ({ request }) =>
    withUser(request, ANYONE, (u) =>
      json({ id: u.id, fullName: u.fullName, email: u.email, phoneNumber: u.phoneNumber, role: u.role, hospitalId: u.hospitalId }),
    ),
  ),

  http.post(url("/auth/forgot-password"), () => text("If the email exists, a reset code has been sent")),

  http.post(url("/auth/reset-password"), async ({ request }) => {
    const { otp, newPassword } = (await request.json()) as { otp: string; newPassword: string };
    if ((newPassword ?? "").length < 8) {
      return json({ error: "Validation failed", fields: { newPassword: "Password must be at least 8 characters" } }, { status: 400 });
    }
    return otp === MOCK_CODE ? text("Password reset successful") : error(400, "Invalid or expired code");
  }),

  // ---------- Hospitals ----------
  http.get(url("/hospital/nearest"), ({ request }) => {
    const q = new URL(request.url).searchParams;
    const lat = Number(q.get("latitude") ?? PATIENT_LOCATION.latitude);
    const lng = Number(q.get("longitude") ?? PATIENT_LOCATION.longitude);
    const limit = Number(q.get("limit") ?? 5);
    const list = db.hospitals
      .filter((h) => h.hospitalStatus === "APPROVED" && h.availableBeds > 0)
      .map((h) => withDistance(h, lat, lng))
      .filter((h) => (h.distanceKm ?? 0) <= 250)
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
      .slice(0, limit);
    return json(list);
  }),

  http.get(url("/hospital/:id/public"), ({ params }) => {
    const h = db.hospitals.find((x) => x.id === Number(params.id));
    return h ? json(h) : error(404, "Hospital not found");
  }),

  http.get(url("/hospital/:id"), ({ request, params }) =>
    withUser(request, HOSPITAL, () => {
      const h = db.hospitals.find((x) => x.id === Number(params.id));
      return h ? json(h) : error(404, "Hospital not found");
    }),
  ),

  // ---------- Emergency (patient) ----------
  http.post(url("/emergency/request"), ({ request }) =>
    withUser(request, PATIENT, async (patient) => {
      const body = (await request.json()) as CreateEmergencyRequest;
      if (!(body.patientCount >= 1)) {
        return json({ error: "Validation failed", fields: { patientCount: "At least 1 patient" } }, { status: 400 });
      }
      if (/no hospital/i.test(body.description ?? "")) return error(409, "No hospital is available near you right now");

      const candidates = db.hospitals
        .filter((h) => h.availableBeds > 0)
        .map((h) => withDistance(h, body.latitude, body.longitude))
        .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
      const hospital =
        body.requestMode === "DIRECT" ? candidates.find((h) => h.id === body.preferredHospitalId) : candidates[0];
      if (!hospital) return error(409, "No hospital is available near you right now");

      const now = new Date();
      const req: EmergencyRequest = {
        id: db.nextId++,
        patientId: patient.id,
        patientName: patient.fullName,
        latitude: body.latitude,
        longitude: body.longitude,
        patientCount: body.patientCount,
        description: body.description,
        requestMode: body.requestMode,
        transportMode: body.transportMode,
        preferredHospitalId: body.preferredHospitalId ?? null,
        triageLevel: body.triageLevel ?? "ORANGE",
        status: "ASSIGNED",
        patientAge: body.patientAge ?? null,
        patientGender: body.patientGender ?? null,
        patientConscious: body.patientConscious ?? null,
        additionalNotes: body.additionalNotes ?? null,
        createdAt: now.toISOString(),
        rating: null,
      };
      const windowMs = req.triageLevel === "RED" ? 2 * 60_000 : 4 * 60_000;
      const assignment: Assignment = {
        id: db.nextId++,
        hospitalId: hospital.id,
        hospitalName: hospital.name,
        hospitalContactNumber: hospital.contactNumber,
        patientsAssigned: req.patientCount,
        status: "PENDING",
        distanceKm: hospital.distanceKm ?? 0,
        assignedAt: now.toISOString(),
        respondedAt: null,
        arrivalTime: null,
        timeoutAt: new Date(now.getTime() + windowMs).toISOString(),
        emergencyRequest: req,
      };
      db.requests.unshift(req);
      db.assignments.unshift(assignment);
      notify(
        hospitalDestination(hospital.id),
        makeNotification({
          type: "EMERGENCY_ASSIGNED",
          title: "New emergency",
          message: `New ${req.triageLevel} request, ${assignment.distanceKm} km away.`,
          hospitalId: hospital.id,
          recipientRole: "HOSPITAL_STAFF",
          emergencyRequestId: req.id,
          assignmentId: assignment.id,
        }),
      );
      // The two apps run on different origins, so each has its own mock data. The patient side
      // gets its acceptance on a timer; the hospital side uses simulateIncomingEmergency (decisions-and-gaps D15).
      scheduleAcceptance(req, patient);
      return json(req, { status: 201 });
    }),
  ),

  http.get(url("/emergency/my-requests"), ({ request }) =>
    withUser(request, PATIENT, (p) => json(db.requests.filter((r) => r.patientId === p.id))),
  ),

  http.get(url("/emergency/requests/:id"), ({ request, params }) =>
    withUser(request, ANYONE, () => {
      const r = findRequest(Number(params.id));
      return r ? json(r) : error(404, "Request not found");
    }),
  ),

  http.get(url("/emergency/requests/:id/assignment"), ({ request, params }) =>
    withUser(request, ANYONE, () => {
      const a = activeAssignment(Number(params.id));
      return a ? json(a) : error(404, "No assignment for this request");
    }),
  ),

  http.get(url("/emergency/requests/:id/hospital-contact"), ({ request, params }) =>
    withUser(request, PATIENT, () => {
      const a = activeAssignment(Number(params.id));
      if (!a) return error(404, "No hospital has accepted this request yet");
      const h = db.hospitals.find((x) => x.id === a.hospitalId);
      return json({ hospitalId: a.hospitalId, hospitalName: a.hospitalName, contactNumber: a.hospitalContactNumber, address: h?.address ?? "" });
    }),
  ),

  http.put(url("/emergency/requests/:id/location"), ({ request, params }) =>
    withUser(request, PATIENT, async () => {
      const r = findRequest(Number(params.id));
      if (!r) return error(404, "Request not found");
      const { latitude, longitude } = (await request.json()) as { latitude: number; longitude: number };
      r.latitude = latitude;
      r.longitude = longitude;
      return text("Location updated");
    }),
  ),

  http.put(url("/emergency/requests/:id/cancel"), ({ request, params }) =>
    withUser(request, PATIENT, () => {
      const r = findRequest(Number(params.id));
      if (!r) return error(404, "Request not found");
      if (r.status === "ACCEPTED" || r.status === "COMPLETED") {
        return error(409, "A hospital has already accepted. Call the hospital instead.");
      }
      r.status = "CANCELLED";
      db.assignments.filter((a) => a.emergencyRequest.id === r.id).forEach((a) => (a.status = "CANCELLED"));
      return text("Request cancelled");
    }),
  ),

  http.put(url("/emergency/requests/:id/complete"), ({ request, params }) =>
    withUser(request, PATIENT, () => {
      const r = findRequest(Number(params.id));
      if (!r) return error(404, "Request not found");
      r.status = "COMPLETED";
      return text("Request completed");
    }),
  ),

  http.put(url("/emergency/requests/:id/feedback"), ({ request, params }) =>
    withUser(request, PATIENT, async () => {
      const r = findRequest(Number(params.id));
      if (!r) return error(404, "Request not found");
      const { rating } = (await request.json()) as { rating: number };
      if (!(rating >= 1 && rating <= 5)) {
        return json({ error: "Validation failed", fields: { rating: "Rating must be between 1 and 5" } }, { status: 400 });
      }
      r.rating = rating;
      return text("Thank you for your feedback");
    }),
  ),

  http.get(url("/routing/route"), ({ request }) =>
    withUser(request, ANYONE, () => {
      const q = new URL(request.url).searchParams;
      const [oLat, oLng, dLat, dLng] = ["originLat", "originLng", "destLat", "destLng"].map((k) => Number(q.get(k)));
      const km = haversineKm(oLat, oLng, dLat, dLng);
      return json({
        distanceKm: km,
        estimatedDurationMinutes: mockMinutes(km),
        points: [{ lat: oLat, lng: oLng }, { lat: dLat, lng: dLng }],
        provider: "mock",
      });
    }),
  ),

  // ---------- Emergency (hospital) ----------
  http.get(url("/emergency/assignments/:hospitalId/stats"), ({ request, params }) =>
    withUser(request, HOSPITAL, () => {
      const list = db.assignments.filter((a) => a.hospitalId === Number(params.hospitalId));
      const count = (s: Assignment["status"]) => list.filter((a) => a.status === s).length;
      return json({ total: list.length, pending: count("PENDING"), accepted: count("ACCEPTED"), rejected: count("REJECTED"), arrived: count("ARRIVED") });
    }),
  ),

  http.get(url("/emergency/assignments/:hospitalId"), ({ request, params }) =>
    withUser(request, HOSPITAL, (user) => {
      if (user.hospitalId !== Number(params.hospitalId)) return forbidden();
      return json(db.assignments.filter((a) => a.hospitalId === user.hospitalId));
    }),
  ),

  http.put(url("/emergency/assignments/:id/accept"), ({ request, params }) =>
    withUser(request, HOSPITAL, () => {
      const id = Number(params.id);
      const a = db.assignments.find((x) => x.id === id);
      if (!a) return error(404, "Assignment not found");
      if (id === TAKEN_BY_OTHER_HOSPITAL_ASSIGNMENT_ID || a.status !== "PENDING") {
        if (id === TAKEN_BY_OTHER_HOSPITAL_ASSIGNMENT_ID) a.status = "CANCELLED";
        return error(409, "This emergency has already been accepted by another hospital");
      }
      a.status = "ACCEPTED";
      a.respondedAt = new Date().toISOString();
      a.emergencyRequest.status = "ACCEPTED";
      const patientRequest = db.requests.find((r) => r.id === a.emergencyRequest.id);
      if (patientRequest) {
        patientRequest.status = "ACCEPTED";
        notify(
          PATIENT_DESTINATION,
          makeNotification({
            type: "EMERGENCY_ACCEPTED",
            title: "Hospital found",
            message: `${a.hospitalName} accepted your request. ${a.distanceKm} km away.`,
            recipientId: patientRequest.patientId,
            recipientRole: "PATIENT",
            emergencyRequestId: patientRequest.id,
            assignmentId: a.id,
          }),
        );
      }
      return json(a);
    }),
  ),

  http.put(url("/emergency/assignments/:id/reject"), ({ request, params }) =>
    withUser(request, HOSPITAL, () => {
      const a = db.assignments.find((x) => x.id === Number(params.id));
      if (!a) return error(404, "Assignment not found");
      if (a.status !== "PENDING") return error(409, "This emergency is no longer pending");
      a.status = "REJECTED";
      a.respondedAt = new Date().toISOString();
      return json(a);
    }),
  ),

  http.put(url("/emergency/assignments/:id/arrived"), ({ request, params }) =>
    withUser(request, HOSPITAL, () => {
      const a = db.assignments.find((x) => x.id === Number(params.id));
      if (!a) return error(404, "Assignment not found");
      if (a.status !== "ACCEPTED") return error(409, "Only accepted cases can be marked arrived");
      a.status = "ARRIVED";
      a.arrivalTime = new Date().toISOString();
      return json(a);
    }),
  ),

  http.get(url("/emergency/requests/:id/patient-location"), ({ request, params }) =>
    withUser(request, HOSPITAL, () => {
      const r = findRequest(Number(params.id));
      return r ? json({ latitude: r.latitude, longitude: r.longitude }) : error(404, "Request not found");
    }),
  ),

  // ---------- Notifications ----------
  http.get(url("/notifications/my/unread/count"), ({ request }) =>
    withUser(request, ANYONE, (u) => json(myNotifications(u).filter((n) => !n.read).length)),
  ),
  http.get(url("/notifications/my/unread"), ({ request }) =>
    withUser(request, ANYONE, (u) => json(myNotifications(u).filter((n) => !n.read))),
  ),
  http.get(url("/notifications/my"), ({ request }) => withUser(request, ANYONE, (u) => json(myNotifications(u)))),
  http.put(url("/notifications/my/read-all"), ({ request }) =>
    withUser(request, ANYONE, (u) => {
      myNotifications(u).forEach((n) => (n.read = true));
      return text("All notifications marked as read");
    }),
  ),
  http.put(url("/notifications/:id/read"), ({ request, params }) =>
    withUser(request, ANYONE, () => {
      const n = db.notifications.find((x) => x.id === Number(params.id));
      if (!n) return error(404, "Notification not found");
      n.read = true;
      return text("Notification marked as read");
    }),
  ),
  http.get(url("/notifications/hospital/:hospitalId"), ({ request, params }) =>
    withUser(request, HOSPITAL, () =>
      json(db.notifications.filter((n) => n.hospitalId === Number(params.hospitalId))),
    ),
  ),
];

/** Hospital app, mock mode: a new PENDING case arrives at hospital 1 (for the hidden "simulate" button). */
export function simulateIncomingEmergency(triageLevel: EmergencyRequest["triageLevel"] = "ORANGE"): Assignment {
  const hospital = db.hospitals[0];
  const now = new Date();
  const id = db.nextId++;
  const req: EmergencyRequest = {
    id,
    patientId: 400 + id,
    patientName: "New Patient",
    latitude: PATIENT_LOCATION.latitude,
    longitude: PATIENT_LOCATION.longitude,
    patientCount: 1,
    description: "Simulated emergency",
    requestMode: "BROADCAST",
    transportMode: "SELF",
    preferredHospitalId: null,
    triageLevel,
    status: "ASSIGNED",
    patientAge: null,
    patientGender: null,
    patientConscious: true,
    additionalNotes: null,
    createdAt: now.toISOString(),
    rating: null,
  };
  const assignment: Assignment = {
    id: db.nextId++,
    hospitalId: hospital.id,
    hospitalName: hospital.name,
    hospitalContactNumber: hospital.contactNumber,
    patientsAssigned: 1,
    status: "PENDING",
    distanceKm: haversineKm(hospital.latitude, hospital.longitude, req.latitude, req.longitude),
    assignedAt: now.toISOString(),
    respondedAt: null,
    arrivalTime: null,
    timeoutAt: new Date(now.getTime() + (triageLevel === "RED" ? 2 : 4) * 60_000).toISOString(),
    emergencyRequest: req,
  };
  db.assignments.unshift(assignment);
  notify(
    hospitalDestination(hospital.id),
    makeNotification({
      type: "EMERGENCY_ASSIGNED",
      title: "New emergency",
      message: `New ${triageLevel} request, ${assignment.distanceKm} km away.`,
      hospitalId: hospital.id,
      recipientRole: "HOSPITAL_STAFF",
      emergencyRequestId: req.id,
      assignmentId: assignment.id,
    }),
  );
  return assignment;
}

function findRequest(id: number): EmergencyRequest | undefined {
  return db.requests.find((r) => r.id === id) ?? db.assignments.find((a) => a.emergencyRequest.id === id)?.emergencyRequest;
}

function activeAssignment(requestId: number): Assignment | undefined {
  const list = db.assignments.filter((a) => a.emergencyRequest.id === requestId);
  return list.find((a) => a.status === "ACCEPTED" || a.status === "ARRIVED") ?? list.find((a) => a.status === "PENDING");
}

function myNotifications(user: MockUser): NotificationMessage[] {
  return db.notifications.filter((n) =>
    user.role === "PATIENT" ? n.recipientId === user.id : n.hospitalId !== null && n.hospitalId === user.hospitalId,
  );
}
