/**
 * Fallback travel time when the API gives no duration.
 * docs/mock-data.md: "time is about 3 minutes per km". See decisions-and-gaps Q7.
 */
export const FALLBACK_MINUTES_PER_KM = 3;

/**
 * Distance format from the design: `1.2 km ~6 min`, under 1 km in metres: `800 m ~4 min`.
 * Pass `minutes` when the API gives it (routing `estimatedDurationMinutes`).
 */
export function formatDistance(distanceKm: number, minutes?: number | null): string {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) return "Distance unknown";

  const mins =
    minutes != null && Number.isFinite(minutes) ? minutes : distanceKm * FALLBACK_MINUTES_PER_KM;
  const roundedMins = Math.max(1, Math.round(mins));

  let distance: string;
  if (distanceKm < 1) {
    const metres = Math.round((distanceKm * 1000) / 10) * 10;
    distance = metres >= 1000 ? "1.0 km" : `${metres} m`;
  } else {
    distance = `${distanceKm.toFixed(1)} km`;
  }
  return `${distance} ~${roundedMins} min`;
}
