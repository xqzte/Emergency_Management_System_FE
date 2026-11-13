import type { NotificationMessage } from "../api/types";

/**
 * idle: not started (no session or no destination yet). connecting: first attempt.
 * connected: subscribed. reconnecting: dropped, retrying. offline: the device has no network.
 */
export type ConnectionStatus = "idle" | "connecting" | "connected" | "reconnecting" | "offline";

export interface NotificationSocketOptions {
  /** /user/queue/notifications for patients, /topic/hospital/{hospitalId} for staff and admins. */
  destination: string;
  /** A signal only: refetch the real data with the normal endpoints (CLAUDE.md rule 5). */
  onMessage: (message: NotificationMessage) => void;
  onStatus: (status: ConnectionStatus) => void;
}

export interface NotificationSocket {
  start(): void;
  stop(): void;
}

export const PATIENT_DESTINATION = "/user/queue/notifications";
export const hospitalDestination = (hospitalId: number) => `/topic/hospital/${hospitalId}`;
