import { Client } from "@stomp/stompjs";
import { WS_URL } from "../api/config";
import { getAccessToken, onAccessTokenChange } from "../api/token";
import type { NotificationMessage } from "../api/types";
import type { NotificationSocket, NotificationSocketOptions } from "./types";

type SockJSConstructor = new (url: string) => WebSocket;

/**
 * STOMP over SockJS to the notification service. Connects with ?token=<access JWT>,
 * reconnects every 5 s after a drop, and reconnects with the fresh token after every refresh.
 */
export function createStompNotificationSocket(options: NotificationSocketOptions): NotificationSocket {
  let client: Client | null = null;
  let running = false;
  let everConnected = false;
  let unsubscribeToken: (() => void) | null = null;
  /** Bumped on every (re)connect so an older, slower connect attempt gives up. */
  let generation = 0;

  async function connect() {
    const myGeneration = ++generation;
    const token = getAccessToken();
    if (!running) return;
    if (!token) {
      options.onStatus("idle");
      return;
    }
    // SockJS touches `window` at import time, so load it only in the browser.
    const SockJS = ((await import("sockjs-client")).default as unknown) as SockJSConstructor;
    if (!running || myGeneration !== generation) return;

    const next = new Client({
      webSocketFactory: () => new SockJS(`${WS_URL}?token=${encodeURIComponent(getAccessToken() ?? "")}`),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      beforeConnect: () => {
        options.onStatus(everConnected ? "reconnecting" : "connecting");
      },
      onConnect: () => {
        everConnected = true;
        options.onStatus("connected");
        next.subscribe(options.destination, (frame) => {
          try {
            options.onMessage(JSON.parse(frame.body) as NotificationMessage);
          } catch {
            // Ignore malformed frames; the next refetch still shows the truth.
          }
        });
      },
      onWebSocketClose: () => {
        if (running) options.onStatus("reconnecting");
      },
      onStompError: () => {
        if (running) options.onStatus("reconnecting");
      },
    });
    client = next;
    next.activate();
  }

  async function disconnect() {
    const current = client;
    client = null;
    if (current) await current.deactivate();
  }

  return {
    start() {
      if (running) return;
      running = true;
      unsubscribeToken = onAccessTokenChange(() => {
        // New token after a refresh (or sign-out): reconnect so the server sees the current one.
        void disconnect().then(connect);
      });
      void connect();
    },
    stop() {
      running = false;
      unsubscribeToken?.();
      unsubscribeToken = null;
      void disconnect();
      options.onStatus("idle");
    },
  };
}
