import { formatDistance } from "../lib/distance";
import { cn } from "../lib/cn";

export interface DistanceTextProps {
  distanceKm: number;
  /** From the API when available (routing estimatedDurationMinutes). */
  minutes?: number | null;
  className?: string;
}

export function DistanceText({ distanceKm, minutes, className }: DistanceTextProps) {
  return (
    <span className={cn("text-base text-muted tabular-nums", className)}>{formatDistance(distanceKm, minutes)}</span>
  );
}
