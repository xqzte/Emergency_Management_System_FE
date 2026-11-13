import { mockNotificationBus } from "./mockBus";
import type { NotificationSocket, NotificationSocketOptions } from "./types";

/** Same contract as the STOMP socket, fed by mockNotificationBus. Mock mode only. */
export function createMockNotificationSocket(options: NotificationSocketOptions): NotificationSocket {
  let unsubscribe: (() => void) | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  return {
    start() {
      if (unsubscribe) return;
      options.onStatus("connecting");
      unsubscribe = mockNotificationBus.subscribe((destination, message) => {
        if (destination === options.destination) options.onMessage(message);
      });
      timer = setTimeout(() => options.onStatus("connected"), 400);
    },
    stop() {
      if (timer) clearTimeout(timer);
      unsubscribe?.();
      unsubscribe = null;
      options.onStatus("idle");
    },
  };
}
