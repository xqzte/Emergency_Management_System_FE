import { afterEach, describe, expect, it, vi } from "vitest";
import type { NotificationMessage } from "../api/types";
import { mockNotificationBus } from "./mockBus";
import { createMockNotificationSocket } from "./mockSocket";
import { PATIENT_DESTINATION, hospitalDestination } from "./types";

const message = { id: 1, type: "EMERGENCY_ACCEPTED" } as NotificationMessage;

afterEach(() => vi.useRealTimers());

describe("mock notification socket", () => {
  it("connects, delivers only its own destination, and stops", () => {
    vi.useFakeTimers();
    const onMessage = vi.fn();
    const onStatus = vi.fn();
    const socket = createMockNotificationSocket({ destination: PATIENT_DESTINATION, onMessage, onStatus });

    socket.start();
    expect(onStatus).toHaveBeenLastCalledWith("connecting");
    vi.advanceTimersByTime(500);
    expect(onStatus).toHaveBeenLastCalledWith("connected");

    mockNotificationBus.publish(hospitalDestination(1), message);
    expect(onMessage).not.toHaveBeenCalled();
    mockNotificationBus.publish(PATIENT_DESTINATION, message);
    expect(onMessage).toHaveBeenCalledWith(message);

    socket.stop();
    expect(onStatus).toHaveBeenLastCalledWith("idle");
    mockNotificationBus.publish(PATIENT_DESTINATION, message);
    expect(onMessage).toHaveBeenCalledTimes(1);
  });
});
