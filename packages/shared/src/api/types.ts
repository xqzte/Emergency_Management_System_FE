/**
 * Shapes from docs/api-contract.md and docs/realtime-and-states.md.
 * Fields marked "assumed" are not spelled out in the contract; confirm in Swagger on Day 10 (decisions-and-gaps Q9).
 */
import type { UrgencyLevel } from "../urgency";

export type Role = "PATIENT" | "HOSPITAL_STAFF" | "HOSPITAL_ADMIN" | "SUPER_ADMIN";

export interface LoginResponse {
  token: string | null;
  role: Role | null;
  userId: number | null;
  requiresTwoFactor: boolean;
  message?: string;
}

export interface RefreshResponse {
  accessToken: string;
  role: Role;
  userId: number;
}

export interface MeResponse {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: Role;
  hospitalId: number | null;
}

export type HospitalType = "PRIVATE" | "PUBLIC" | "MISSION" | "FEDERAL";
export type HospitalStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED" | "INACTIVE";

export interface HospitalResponse {
  id: number;
  name: string;
  address: string;
  contactNumber: string;
  latitude: number;
  longitude: number;
  totalBeds: number;
  availableBeds: number;
  hospitalType: HospitalType;
  hospitalStatus: HospitalStatus;
  distanceKm: number | null;
  adminId: number | null;
  adminName: string | null;
  adminEmail: string | null;
  adminPhone: string | null;
}

export type RequestStatus = "PENDING" | "ASSIGNED" | "ACCEPTED" | "REJECTED" | "COMPLETED" | "CANCELLED";
export type AssignmentStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "ARRIVED" | "CANCELLED";
export type RequestMode = "BROADCAST" | "DIRECT";
export type TransportMode = "AMBULANCE" | "SELF";
export type Gender = "MALE" | "FEMALE";

export interface CreateEmergencyRequest {
  latitude: number;
  longitude: number;
  patientCount: number;
  description: string;
  requestMode: RequestMode;
  transportMode: TransportMode;
  preferredHospitalId?: number;
  triageLevel?: UrgencyLevel;
  patientAge?: number;
  patientGender?: Gender;
  patientConscious?: boolean;
  additionalNotes?: string;
}

/** Assumed shape: the contract lists the request body and the nested fields on assignments only. */
export interface EmergencyRequest {
  id: number;
  patientId: number;
  patientName: string;
  latitude: number;
  longitude: number;
  patientCount: number;
  description: string;
  requestMode: RequestMode;
  transportMode: TransportMode;
  preferredHospitalId: number | null;
  triageLevel: UrgencyLevel;
  status: RequestStatus;
  patientAge: number | null;
  patientGender: Gender | null;
  patientConscious: boolean | null;
  additionalNotes: string | null;
  createdAt: string;
  rating: number | null;
}

export interface Assignment {
  id: number;
  hospitalId: number;
  hospitalName: string;
  hospitalContactNumber: string;
  patientsAssigned: number;
  status: AssignmentStatus;
  distanceKm: number;
  assignedAt: string;
  respondedAt: string | null;
  arrivalTime: string | null;
  /** Count down from this, never from a hard-coded number (CLAUDE.md rule 6). */
  timeoutAt: string;
  emergencyRequest: EmergencyRequest;
}

export interface RouteResponse {
  distanceKm: number;
  estimatedDurationMinutes: number;
  points: Array<{ lat: number; lng: number }>;
  provider: string;
}

export interface AssignmentStats {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  arrived: number;
}

export type NotificationType =
  | "EMERGENCY_ASSIGNED"
  | "EMERGENCY_ACCEPTED"
  | "EMERGENCY_REROUTED"
  | "EMERGENCY_CANCELLED"
  | "TIMEOUT_WARNING"
  // Not emitted yet; do not rely on them (realtime-and-states.md).
  | "EMERGENCY_REJECTED"
  | "PATIENT_EN_ROUTE"
  | "PATIENT_ARRIVED"
  | "ASSIGNMENT_TIMEOUT";

export interface NotificationMessage {
  id: number;
  recipientId: number | null;
  recipientRole: Role | null;
  hospitalId: number | null;
  type: NotificationType;
  title: string;
  message: string;
  emergencyRequestId: number | null;
  assignmentId: number | null;
  read: boolean;
  createdAt: string;
}
