"use client";

import { useEffect, useRef, useState } from "react";
import { USE_MOCKS } from "../api/config";
import type { NotificationMessage } from "../api/types";
import { createMockNotificationSocket } from "./mockSocket";
import { createStompNotificationSocket } from "./stompSocket";
import type { ConnectionStatus } from "./types";

/**
 * Keeps one notification socket open for `destination` (null = not signed in yet).
 * Returns the status for the "Emergency network connected" line. Goes "offline" when the device loses network.
 */
export function useNotificationSocket(
  destination: string | null,
  onMessage: (message: NotificationMessage) => void,
): ConnectionStatus {
  const [socketStatus, setSocketStatus] = useState<ConnectionStatus>("idle");
  const [online, setOnline] = useState(true);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    if (!destination) return;
    const create = USE_MOCKS ? createMockNotificationSocket : createStompNotificationSocket;
    const socket = create({
      destination,
      onMessage: (message) => onMessageRef.current(message),
      onStatus: setSocketStatus,
    });
    socket.start();
    return () => socket.stop();
  }, [destination]);

  if (!online) return "offline";
  return destination ? socketStatus : "idle";
}
