import type { CSSProperties } from "react";
import { URGENCY, type UrgencyLevel, type UrgencyShape } from "../urgency";
import { cn } from "../lib/cn";

/*
 * The ONLY place urgency colours are defined (docs/design-system.md, CLAUDE.md rule 1).
 * Every screen shows urgency through this component: colour, shape and word together.
 */
const URGENCY_COLOURS: Record<UrgencyLevel, { fill: string; ink: string; outline: string }> = {
  RED: { fill: "#8B2A23", ink: "#FFFFFF", outline: "#8B2A23" },
  ORANGE: { fill: "#FBEBD2", ink: "#874100", outline: "#874100" },
  YELLOW: { fill: "#F9F2C8", ink: "#625001", outline: "#625001" },
  GREEN: { fill: "#E5EFE4", ink: "#226336", outline: "#226336" },
};

const SHAPE_PATHS: Record<UrgencyShape, string> = {
  octagon: "M7 1h10l6 6v10l-6 6H7l-6-6V7z",
  triangle: "M12 2 23 22H1z",
  diamond: "M12 1 23 12 12 23 1 12z",
  circle: "M12 1a11 11 0 1 0 0 22a11 11 0 1 0 0-22z",
};

export function UrgencyShapeIcon({
  shape,
  size = 16,
  colour,
}: {
  shape: UrgencyShape;
  size?: number;
  colour: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="shrink-0">
      <path d={SHAPE_PATHS[shape]} fill={colour} />
    </svg>
  );
}

export interface UrgencyBadgeProps {
  level: UrgencyLevel;
  size?: "md" | "lg";
  /** Adds the one-line meaning under the word, e.g. "Life-threatening". */
  showDescription?: boolean;
  className?: string;
}

export function UrgencyBadge({ level, size = "md", showDescription = false, className }: UrgencyBadgeProps) {
  const def = URGENCY[level];
  const colours = URGENCY_COLOURS[level];
  const style: CSSProperties = {
    backgroundColor: colours.fill,
    color: colours.ink,
    borderColor: colours.outline,
  };

  return (
    <span
      style={style}
      className={cn(
        "inline-flex items-center gap-2 border-2 font-semibold",
        showDescription ? "rounded-2xl" : "rounded-full",
        size === "lg" ? "px-4 py-2 text-title" : "px-3 py-1 text-base",
        className,
      )}
    >
      <UrgencyShapeIcon shape={def.shape} size={size === "lg" ? 20 : 16} colour={colours.ink} />
      {showDescription ? (
        <span className="flex flex-col leading-tight">
          <span>{def.label}</span>
          <span className="text-base font-normal">{def.description}</span>
        </span>
      ) : (
        <span>{def.label}</span>
      )}
    </span>
  );
}
