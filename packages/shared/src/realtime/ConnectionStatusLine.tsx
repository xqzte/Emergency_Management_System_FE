import { cn } from "../lib/cn";
import type { ConnectionStatus } from "./types";

const TEXT: Record<ConnectionStatus, string> = {
  connected: "Emergency network connected",
  connecting: "Connecting to the emergency network…",
  reconnecting: "Reconnecting to the emergency network…",
  offline: "No connection. Emergency network unavailable.",
  idle: "Emergency network not connected",
};

/** The status line from the design. Shows the WebSocket state; never the urgency colours. */
export function ConnectionStatusLine({ status, className }: { status: ConnectionStatus; className?: string }) {
  return (
    <p role="status" aria-live="polite" className={cn("flex items-center gap-2 text-base text-ink", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "inline-block size-2.5 shrink-0 rounded-full",
          status === "connected" && "bg-gold",
          (status === "connecting" || status === "reconnecting") && "animate-pulse bg-gold/50",
          (status === "offline" || status === "idle") && "border-2 border-muted bg-transparent",
        )}
      />
      <span className={status === "connected" ? "font-semibold" : undefined}>{TEXT[status]}</span>
    </p>
  );
}
