import { describe, expect, it } from "vitest";
import { compareUrgency, isUrgencyLevel, URGENCY } from "./urgency";

describe("urgency", () => {
  it("maps API values to words and shapes", () => {
    expect(URGENCY.RED).toMatchObject({ label: "Critical", shape: "octagon" });
    expect(URGENCY.ORANGE).toMatchObject({ label: "Urgent", shape: "triangle" });
    expect(URGENCY.YELLOW).toMatchObject({ label: "Moderate", shape: "diamond" });
    expect(URGENCY.GREEN).toMatchObject({ label: "Minor", shape: "circle" });
  });

  it("sorts most urgent first", () => {
    expect((["GREEN", "RED", "YELLOW", "ORANGE"] as const).slice().sort(compareUrgency)).toEqual([
      "RED",
      "ORANGE",
      "YELLOW",
      "GREEN",
    ]);
  });

  it("validates API values", () => {
    expect(isUrgencyLevel("RED")).toBe(true);
    expect(isUrgencyLevel("red")).toBe(false);
  });
});
