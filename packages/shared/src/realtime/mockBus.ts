import type { NotificationMessage } from "../api/types";

type Listener = (destination: string, message: NotificationMessage) => void;

const listeners = new Set<Listener>();

/**
 * In-page stand-in for the notification service, used only when NEXT_PUBLIC_USE_MOCKS=true.
 * Mock API handlers (and the hidden "simulate" buttons) publish here; the mock socket delivers.
 */
export const mockNotificationBus = {
  publish(destination: string, message: NotificationMessage) {
    listeners.forEach((listener) => listener(destination, message));
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
