import { describe, expect, it } from "vitest";
import { formatDistance } from "./distance";

describe("formatDistance", () => {
  it("uses km with one decimal at 1 km and above", () => {
    expect(formatDistance(1.2, 6)).toBe("1.2 km ~6 min");
    expect(formatDistance(12.345, 30.4)).toBe("12.3 km ~30 min");
  });

  it("uses metres under 1 km", () => {
    expect(formatDistance(0.8, 4)).toBe("800 m ~4 min");
    expect(formatDistance(0.123, 0.2)).toBe("120 m ~1 min");
  });

  it("estimates minutes when the API gives none", () => {
    expect(formatDistance(2)).toBe("2.0 km ~6 min");
    expect(formatDistance(0.999)).toBe("1.0 km ~3 min");
  });

  it("handles bad input", () => {
    expect(formatDistance(Number.NaN)).toBe("Distance unknown");
    expect(formatDistance(-1)).toBe("Distance unknown");
  });
});
