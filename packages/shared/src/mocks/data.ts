/** Fake data from docs/mock-data.md. Mock mode only. */
import type { Assignment, EmergencyRequest, HospitalResponse, MeResponse, NotificationMessage } from "../api/types";
import { FALLBACK_MINUTES_PER_KM } from "../lib/distance";

export const MOCK_CODE = "123456";
export const MOCK_WRONG_PASSWORD = "wrongpass1";
export const PATIENT_LOCATION = { latitude: 9.0579, longitude: 7.4951 };

export interface MockUser extends MeResponse {
  twoFactor: boolean;
}

export const MOCK_USERS: MockUser[] = [
  {
    id: 101,
    fullName: "Adam Test",
    email: "patient@example.test",
    phoneNumber: "08000000001",
    role: "PATIENT",
    hospitalId: null,
    twoFactor: false,
  },
  {
    id: 201,
    fullName: "Amina Staff",
    email: "staff@example.test",
    phoneNumber: "08000000002",
    role: "HOSPITAL_STAFF",
    hospitalId: 1,
    twoFactor: false,
  },
  {
    id: 202,
    fullName: "Musa Admin",
    email: "admin@example.test",
    phoneNumber: "08000000003",
    role: "HOSPITAL_ADMIN",
    hospitalId: 1,
    twoFactor: true,
  },
];

type HospitalSeed = Pick<
  HospitalResponse,
  "id" | "name" | "address" | "latitude" | "longitude" | "hospitalType" | "availableBeds" | "totalBeds"
>;

const HOSPITAL_SEEDS: HospitalSeed[] = [
  { id: 1, name: "Garki General Hospital", address: "Garki Area 3, Abuja", latitude: 9.0336, longitude: 7.4881, hospitalType: "PUBLIC", availableBeds: 8, totalBeds: 40 },
  { id: 2, name: "Wuse Specialist Clinic", address: "Wuse Zone 5, Abuja", latitude: 9.0765, longitude: 7.4698, hospitalType: "PRIVATE", availableBeds: 3, totalBeds: 20 },
  { id: 3, name: "Maitama District Hospital", address: "Maitama, Abuja", latitude: 9.0836, longitude: 7.4931, hospitalType: "PUBLIC", availableBeds: 12, totalBeds: 60 },
  { id: 4, name: "Asokoro Medical Centre", address: "Asokoro, Abuja", latitude: 9.0388, longitude: 7.52, hospitalType: "PRIVATE", availableBeds: 1, totalBeds: 15 },
  { id: 5, name: "Gwarinpa Community Hospital", address: "Gwarinpa, Abuja", latitude: 9.1107, longitude: 7.4029, hospitalType: "PUBLIC", availableBeds: 9, totalBeds: 50 },
  { id: 6, name: "Central District Hospital", address: "Central District, Abuja", latitude: 9.056, longitude: 7.489, hospitalType: "FEDERAL", availableBeds: 20, totalBeds: 120 },
];

export function makeHospitals(): HospitalResponse[] {
  return HOSPITAL_SEEDS.map((h) => ({
    ...h,
    contactNumber: `0900000000${h.id}`,
    hospitalStatus: "APPROVED",
    distanceKm: null,
    adminId: h.id === 1 ? 202 : null,
    adminName: h.id === 1 ? "Musa Admin" : null,
    adminEmail: h.id === 1 ? "admin@example.test" : null,
    adminPhone: h.id === 1 ? "08000000003" : null,
  }));
}

/** Straight-line distance in km (docs/mock-data.md: distance is a straight-line estimate). */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(6371 * 2 * Math.asin(Math.sqrt(a)) * 100) / 100;
}

export const mockMinutes = (km: number) => Math.max(1, Math.round(km * FALLBACK_MINUTES_PER_KM));

const iso = (msFromNow: number) => new Date(Date.now() + msFromNow).toISOString();
const MIN = 60_000;

interface CaseSeed {
  name: string;
  age: number;
  description: string;
  triage: EmergencyRequest["triageLevel"];
  status: Assignment["status"];
  count?: number;
  /** Where the patient is, so the board shows varied distances. */
  lat: number;
  lng: number;
}

/** Hospital 1 board (docs/mock-data.md). Grace's case returns 409 on accept: another hospital took it. */
const CASE_SEEDS: CaseSeed[] = [
  { name: "Ibrahim M.", age: 54, description: "Chest pain", triage: "RED", status: "PENDING", lat: 9.0412, lng: 7.4855 },
  { name: "Fatima S.", age: 7, description: "Allergic reaction", triage: "ORANGE", status: "ACCEPTED", lat: 9.0501, lng: 7.4789 },
  { name: "Tunde A.", age: 41, description: "Road accident", triage: "YELLOW", status: "PENDING", lat: 9.0299, lng: 7.5012 },
  { name: "Grace O.", age: 29, description: "High fever", triage: "YELLOW", status: "PENDING", count: 2, lat: 9.0603, lng: 7.4702 },
  { name: "John E.", age: 33, description: "Deep cut", triage: "GREEN", status: "ARRIVED", lat: 9.0355, lng: 7.4920 },
];
export const TAKEN_BY_OTHER_HOSPITAL_ASSIGNMENT_ID = 904;

export function makeBoardAssignments(hospital: HospitalResponse): Assignment[] {
  return CASE_SEEDS.map((c, i) => {
    const id = 901 + i;
    const assignedAgo = (i + 1) * MIN;
    // RED gets 2 minutes, others 4 (realtime-and-states.md). Pending ones start a little in, so timers differ.
    const window = c.triage === "RED" ? 2 * MIN : 4 * MIN;
    const assignedAt = c.status === "PENDING" ? iso(-(i * 15_000)) : iso(-assignedAgo * 5);
    const timeoutAt = new Date(new Date(assignedAt).getTime() + window).toISOString();
    const request: EmergencyRequest = {
      id: 2040 + i,
      patientId: 300 + i,
      patientName: c.name,
      latitude: c.lat,
      longitude: c.lng,
      patientCount: c.count ?? 1,
      description: c.description,
      requestMode: "BROADCAST",
      transportMode: "SELF",
      preferredHospitalId: null,
      triageLevel: c.triage,
      status: c.status === "PENDING" ? "ASSIGNED" : "ACCEPTED",
      patientAge: c.age,
      patientGender: null,
      patientConscious: true,
      additionalNotes: null,
      createdAt: assignedAt,
      rating: null,
    };
    return {
      id,
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      hospitalContactNumber: hospital.contactNumber,
      patientsAssigned: c.count ?? 1,
      status: c.status,
      distanceKm: haversineKm(hospital.latitude, hospital.longitude, c.lat, c.lng),
      assignedAt,
      respondedAt: c.status === "PENDING" ? null : iso(-assignedAgo * 4),
      arrivalTime: c.status === "ARRIVED" ? iso(-assignedAgo) : null,
      timeoutAt,
      emergencyRequest: request,
    };
  });
}

export function makeNotification(partial: Partial<NotificationMessage> & Pick<NotificationMessage, "type" | "title" | "message">): NotificationMessage {
  return {
    id: Math.floor(Math.random() * 1_000_000),
    recipientId: null,
    recipientRole: null,
    hospitalId: null,
    emergencyRequestId: null,
    assignmentId: null,
    read: false,
    createdAt: new Date().toISOString(),
    ...partial,
  };
}
